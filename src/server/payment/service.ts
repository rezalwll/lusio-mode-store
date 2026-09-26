import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, paymentAttempts, paymentEvents } from "@/db/schema";
import { createCorrelationId } from "@/server/observability/correlation";
import { logServer } from "@/server/observability/logger";
import { getConfiguredPaymentProvider, getPaymentProviderForCallback, type VerifyPaymentResult } from "./provider";

const ACTIVE_STATUSES = ["created", "awaiting_user", "verifying"] as const;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeMetadata(value: Record<string, unknown> | undefined) {
  if (!value) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, item]) => !/token|secret|password|credential|payload/i.test(key) && ["string", "number", "boolean"].includes(typeof item)).slice(0, 30));
}

export type StartPaymentResult =
  | { ok: true; attemptId: string; redirectUrl: string }
  | { ok: false; status: 404 | 409 | 503; code: string; message: string; attemptId?: string };

export async function startPayment(input: { orderId: string; trackingToken: string; idempotencyKey: string; callbackOrigin: string; correlationId?: string }): Promise<StartPaymentResult> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const db = getDb();
  const [order] = await db.select().from(orders).where(and(eq(orders.id, input.orderId), eq(orders.publicTokenHash, sha256(input.trackingToken)))).limit(1);
  if (!order) return { ok: false, status: 404, code: "order_not_found", message: "سفارش پیدا نشد" };
  if (order.status === "cancelled" || order.paymentStatus === "paid") return { ok: false, status: 409, code: "order_not_payable", message: "این سفارش قابل پرداخت نیست" };

  const [existing] = await db.select().from(paymentAttempts).where(eq(paymentAttempts.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing) {
    if (existing.orderId !== order.id || existing.amountRial !== order.totalRial) return { ok: false, status: 409, code: "idempotency_conflict", message: "شناسه درخواست با سفارش دیگری استفاده شده است" };
    return existing.status === "awaiting_user" && typeof existing.metadata.redirectUrl === "string"
      ? { ok: true, attemptId: existing.id, redirectUrl: existing.metadata.redirectUrl }
      : { ok: false, status: 503, code: existing.failureCode || "payment_unavailable", message: existing.failureMessage || "پرداخت فعلاً در دسترس نیست", attemptId: existing.id };
  }

  const provider = getConfiguredPaymentProvider();
  const callbackToken = randomBytes(32).toString("base64url");
  const [attempt] = await db.insert(paymentAttempts).values({
    orderId: order.id,
    providerKey: provider.key,
    amountRial: order.totalRial,
    idempotencyKey: input.idempotencyKey,
    callbackTokenHash: sha256(callbackToken),
  }).returning();
  const callbackUrl = `${input.callbackOrigin.replace(/\/$/, "")}/api/payments/callback/${encodeURIComponent(provider.key)}?attempt=${attempt.id}&state=${encodeURIComponent(callbackToken)}`;
  const result = await provider.createPayment({ attemptId: attempt.id, orderId: order.id, amountRial: order.totalRial, callbackUrl, idempotencyKey: input.idempotencyKey });
  if (!result.ok) {
    await db.update(paymentAttempts).set({ status: "failed", failureCode: result.code, failureMessage: result.message.slice(0, 500), updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    logServer("warn", "payment.start.unavailable", result.message, { correlationId, attemptId: attempt.id, orderId: order.id, provider: provider.key, code: result.code });
    return { ok: false, status: 503, code: result.code, message: result.message, attemptId: attempt.id };
  }
  await db.update(paymentAttempts).set({ status: "awaiting_user", providerAuthority: result.authority, metadata: { ...safeMetadata(result.metadata), redirectUrl: result.redirectUrl }, updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
  logServer("info", "payment.start.created", "Payment attempt created", { correlationId, attemptId: attempt.id, orderId: order.id, provider: provider.key });
  return { ok: true, attemptId: attempt.id, redirectUrl: result.redirectUrl };
}

async function applyVerification(attemptId: string, result: VerifyPaymentResult, correlationId: string) {
  return getDb().transaction(async (tx) => {
    const [attempt] = await tx.select().from(paymentAttempts).where(eq(paymentAttempts.id, attemptId)).for("update").limit(1);
    if (!attempt) throw new Error("PAYMENT_ATTEMPT_NOT_FOUND");
    const [order] = await tx.select().from(orders).where(eq(orders.id, attempt.orderId)).for("update").limit(1);
    if (!order) throw new Error("PAYMENT_ORDER_NOT_FOUND");
    if (attempt.status === "paid") return { status: "paid" as const, duplicate: true, orderId: order.id };
    if (result.status === "paid") {
      if (result.amountRial === undefined || result.amountRial !== attempt.amountRial || result.amountRial !== order.totalRial) throw new Error("PAYMENT_AMOUNT_MISMATCH");
      await tx.update(paymentAttempts).set({ status: "paid", providerTransactionId: result.transactionId || null, failureCode: null, failureMessage: null, metadata: safeMetadata(result.metadata), verifiedAt: new Date(), updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
      if (order.paymentStatus !== "paid") await tx.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, order.id));
      logServer("info", "payment.verify.paid", "Payment verified", { correlationId, attemptId, orderId: order.id, provider: attempt.providerKey });
      return { status: "paid" as const, duplicate: false, orderId: order.id };
    }
    const status = result.status === "pending" ? "awaiting_user" : result.status;
    await tx.update(paymentAttempts).set({ status, failureCode: result.failureCode || null, failureMessage: result.failureMessage?.slice(0, 500) || null, metadata: safeMetadata(result.metadata), updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    if (result.status === "failed" && order.paymentStatus === "pending") await tx.update(orders).set({ paymentStatus: "failed", updatedAt: new Date() }).where(eq(orders.id, order.id));
    return { status: result.status, duplicate: false, orderId: order.id };
  });
}

export async function processPaymentCallback(providerKey: string, request: Request) {
  const correlationId = createCorrelationId();
  const url = new URL(request.url);
  const attemptId = url.searchParams.get("attempt") || "";
  const state = url.searchParams.get("state") || "";
  const [attempt] = await getDb().select().from(paymentAttempts).where(and(eq(paymentAttempts.id, attemptId), eq(paymentAttempts.callbackTokenHash, sha256(state)))).limit(1);
  if (!attempt || attempt.providerKey !== providerKey) return { ok: false as const, status: 404, message: "درخواست پرداخت معتبر نیست" };
  let body: Record<string, unknown> = {};
  if (request.method !== "GET") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) body = await request.json() as Record<string, unknown>;
    else body = Object.fromEntries(Array.from((await request.formData()).entries(), ([key, value]) => [key, typeof value === "string" ? value.slice(0, 1_000) : "[file]"]));
  }
  try {
    const provider = getPaymentProviderForCallback(providerKey);
    const callback = await provider.parseCallback({ url, method: request.method, body });
    if (attempt.providerAuthority && callback.authority !== attempt.providerAuthority) return { ok: false as const, status: 409, message: "شناسه پرداخت تطابق ندارد" };
    const deduplicationKey = sha256(`${providerKey}:${callback.providerEventId || callback.authority}:${attempt.id}:${JSON.stringify(safeMetadata(callback.metadata))}`);
    const [event] = await getDb().insert(paymentEvents).values({ paymentAttemptId: attempt.id, orderId: attempt.orderId, providerKey, eventType: "callback_received", deduplicationKey, providerEventId: callback.providerEventId || null, correlationId, metadata: safeMetadata(callback.metadata) }).onConflictDoNothing().returning();
    if (!event) {
      const [latest] = await getDb().select().from(paymentAttempts).where(eq(paymentAttempts.id, attempt.id)).limit(1);
      return { ok: true as const, duplicate: true, paymentStatus: latest?.status || attempt.status, orderId: attempt.orderId };
    }
    await getDb().update(paymentAttempts).set({ status: "verifying", updatedAt: new Date() }).where(and(eq(paymentAttempts.id, attempt.id), inArray(paymentAttempts.status, [...ACTIVE_STATUSES])));
    const result = await provider.verifyPayment({ authority: callback.authority, expectedAmountRial: attempt.amountRial, orderId: attempt.orderId });
    const applied = await applyVerification(attempt.id, result, correlationId);
    await getDb().insert(paymentEvents).values({ paymentAttemptId: attempt.id, orderId: attempt.orderId, providerKey, eventType: `verification_${applied.status}`, deduplicationKey: sha256(`${deduplicationKey}:verification:${applied.status}`), providerEventId: callback.providerEventId || null, correlationId, metadata: { duplicate: applied.duplicate } }).onConflictDoNothing();
    return { ok: true as const, duplicate: applied.duplicate, paymentStatus: applied.status, orderId: applied.orderId };
  } catch (error) {
    logServer("error", "payment.callback.failed", "Payment callback processing failed", { correlationId, attemptId, orderId: attempt.orderId, provider: providerKey }, error);
    return { ok: false as const, status: 503, message: "تأیید پرداخت در دسترس نیست" };
  }
}

export async function reconcilePendingPayments({ olderThan = new Date(Date.now() - 10 * 60_000), limit = 100 } = {}) {
  const provider = getConfiguredPaymentProvider();
  if (!provider.queryPayment) return { examined: 0, paid: 0, failed: 0, skipped: true, reason: "provider_query_unavailable" };
  const attempts = await getDb().select().from(paymentAttempts).where(and(inArray(paymentAttempts.status, [...ACTIVE_STATUSES]), eq(paymentAttempts.providerKey, provider.key), lt(paymentAttempts.updatedAt, olderThan))).limit(limit);
  let paid = 0;
  let failed = 0;
  for (const attempt of attempts) {
    if (!attempt.providerAuthority) continue;
    const correlationId = createCorrelationId();
    try {
      const result = await provider.queryPayment({ authority: attempt.providerAuthority, expectedAmountRial: attempt.amountRial, orderId: attempt.orderId });
      const applied = await applyVerification(attempt.id, result, correlationId);
      if (applied.status === "paid") paid += 1;
      if (applied.status === "failed") failed += 1;
    } catch (error) {
      logServer("error", "payment.reconcile.failed", "Payment reconciliation failed", { correlationId, attemptId: attempt.id, orderId: attempt.orderId, provider: provider.key }, error);
    }
  }
  return { examined: attempts.length, paid, failed, skipped: false };
}
