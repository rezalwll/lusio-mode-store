import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { couponRedemptions, orders, paymentAttempts, paymentEvents } from "@/db/schema";
import { releaseUnpaidOrder } from "@/server/commerce/reservations";
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
  const provider = getConfiguredPaymentProvider();
  const callbackToken = randomBytes(32).toString("base64url");
  const initialized = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(and(eq(orders.id, input.orderId), eq(orders.publicTokenHash, sha256(input.trackingToken)))).for("update").limit(1);
    if (!order) return { kind: "not_found" as const };
    if (order.status === "cancelled" || order.inventoryReleasedAt || order.paymentStatus === "paid") return { kind: "not_payable" as const };
    if (order.reservationExpiresAt <= new Date()) return { kind: "expired" as const, orderId: order.id };
    const [existing] = await tx.select().from(paymentAttempts).where(eq(paymentAttempts.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing) return { kind: "existing" as const, order, attempt: existing };
    const [attempt] = await tx.insert(paymentAttempts).values({
      orderId: order.id,
      providerKey: provider.key,
      amountRial: order.totalRial,
      idempotencyKey: input.idempotencyKey,
      callbackTokenHash: sha256(callbackToken),
    }).returning();
    return { kind: "created" as const, order, attempt };
  });
  if (initialized.kind === "not_found") return { ok: false, status: 404, code: "order_not_found", message: "سفارش پیدا نشد" };
  if (initialized.kind === "not_payable") return { ok: false, status: 409, code: "order_not_payable", message: "این سفارش قابل پرداخت نیست" };
  if (initialized.kind === "expired") {
    await releaseUnpaidOrder({ orderId: initialized.orderId, reason: "reservation_expired", correlationId });
    return { ok: false, status: 409, code: "order_not_payable", message: "مهلت پرداخت این سفارش تمام شده است" };
  }
  const { order, attempt } = initialized;
  if (initialized.kind === "existing") {
    if (attempt.orderId !== order.id || attempt.amountRial !== order.totalRial) return { ok: false, status: 409, code: "idempotency_conflict", message: "شناسه درخواست با سفارش دیگری استفاده شده است" };
    return attempt.status === "awaiting_user" && typeof attempt.metadata.redirectUrl === "string"
      ? { ok: true, attemptId: attempt.id, redirectUrl: attempt.metadata.redirectUrl }
      : { ok: false, status: 503, code: attempt.failureCode || "payment_unavailable", message: attempt.failureMessage || "پرداخت فعلاً در دسترس نیست", attemptId: attempt.id };
  }
  const callbackUrl = `${input.callbackOrigin.replace(/\/$/, "")}/api/payments/callback/${encodeURIComponent(provider.key)}?attempt=${attempt.id}&state=${encodeURIComponent(callbackToken)}`;
  const result = await provider.createPayment({ attemptId: attempt.id, orderId: order.id, amountRial: order.totalRial, callbackUrl, idempotencyKey: input.idempotencyKey });
  if (!result.ok) {
    const updated = await db.update(paymentAttempts).set({ status: "failed", failureCode: result.code, failureMessage: result.message.slice(0, 500), updatedAt: new Date() }).where(and(eq(paymentAttempts.id, attempt.id), eq(paymentAttempts.status, "created"))).returning({ id: paymentAttempts.id });
    if (!updated[0]) return { ok: false, status: 409, code: "order_not_payable", message: "این سفارش دیگر قابل پرداخت نیست", attemptId: attempt.id };
    logServer("warn", "payment.start.unavailable", result.message, { correlationId, attemptId: attempt.id, orderId: order.id, provider: provider.key, code: result.code });
    return { ok: false, status: 503, code: result.code, message: result.message, attemptId: attempt.id };
  }
  const activated = await db.transaction(async (tx) => {
    const [latestOrder] = await tx.select().from(orders).where(eq(orders.id, order.id)).for("update").limit(1);
    const [latestAttempt] = await tx.select().from(paymentAttempts).where(eq(paymentAttempts.id, attempt.id)).for("update").limit(1);
    if (!latestOrder || !latestAttempt || latestOrder.status === "cancelled" || latestOrder.inventoryReleasedAt || latestOrder.paymentStatus === "paid" || latestAttempt.status !== "created") return false;
    await tx.update(paymentAttempts).set({ status: "awaiting_user", providerAuthority: result.authority, metadata: { ...safeMetadata(result.metadata), redirectUrl: result.redirectUrl }, updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    return true;
  });
  if (!activated) return { ok: false, status: 409, code: "order_not_payable", message: "این سفارش دیگر قابل پرداخت نیست", attemptId: attempt.id };
  logServer("info", "payment.start.created", "Payment attempt created", { correlationId, attemptId: attempt.id, orderId: order.id, provider: provider.key });
  return { ok: true, attemptId: attempt.id, redirectUrl: result.redirectUrl };
}

export async function applyPaymentVerification(attemptId: string, result: VerifyPaymentResult, correlationId = createCorrelationId()) {
  const applied = await getDb().transaction(async (tx) => {
    const [attemptSnapshot] = await tx.select({ orderId: paymentAttempts.orderId }).from(paymentAttempts).where(eq(paymentAttempts.id, attemptId)).limit(1);
    if (!attemptSnapshot) throw new Error("PAYMENT_ATTEMPT_NOT_FOUND");
    const [order] = await tx.select().from(orders).where(eq(orders.id, attemptSnapshot.orderId)).for("update").limit(1);
    if (!order) throw new Error("PAYMENT_ORDER_NOT_FOUND");
    const [attempt] = await tx.select().from(paymentAttempts).where(eq(paymentAttempts.id, attemptId)).for("update").limit(1);
    if (!attempt) throw new Error("PAYMENT_ATTEMPT_NOT_FOUND");
    if (attempt.status === "paid") return { status: "paid" as const, duplicate: true, orderId: order.id, reviewRequired: order.paymentReviewRequired };
    if (result.status === "paid") {
      if (result.amountRial === undefined || result.amountRial !== attempt.amountRial || result.amountRial !== order.totalRial) throw new Error("PAYMENT_AMOUNT_MISMATCH");
      await tx.update(paymentAttempts).set({ status: "paid", providerTransactionId: result.transactionId || null, failureCode: null, failureMessage: null, metadata: safeMetadata(result.metadata), verifiedAt: new Date(), updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
      const released = Boolean(order.inventoryReleasedAt) || order.status === "cancelled";
      if (released) {
        await tx.update(orders).set({ paymentStatus: "paid", paymentReviewRequired: true, paymentReviewReason: "late payment verified after reservation release", updatedAt: new Date() }).where(eq(orders.id, order.id));
      } else {
        await tx.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, order.id));
        await tx.update(couponRedemptions).set({ status: "consumed", releasedAt: null }).where(and(eq(couponRedemptions.orderId, order.id), eq(couponRedemptions.status, "reserved")));
      }
      return { status: "paid" as const, duplicate: false, orderId: order.id, reviewRequired: released, provider: attempt.providerKey };
    }
    const status = result.status === "pending" ? "awaiting_user" : result.status;
    await tx.update(paymentAttempts).set({ status, failureCode: result.failureCode || null, failureMessage: result.failureMessage?.slice(0, 500) || null, metadata: safeMetadata(result.metadata), updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    if (result.status === "failed" && order.paymentStatus === "pending") await tx.update(orders).set({ paymentStatus: "failed", updatedAt: new Date() }).where(eq(orders.id, order.id));
    return { status: result.status, duplicate: false, orderId: order.id, reviewRequired: false, provider: attempt.providerKey };
  });
  if (applied.status === "paid" && applied.reviewRequired) {
    logServer("error", "order.payment_late_after_release", "Captured payment requires manual review because reservation resources were released", { correlationId, attemptId, orderId: applied.orderId, provider: applied.provider });
  } else if (applied.status === "paid") {
    logServer("info", "payment.verify.paid", "Payment verified", { correlationId, attemptId, orderId: applied.orderId, provider: applied.provider });
  }
  return applied;
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
    const applied = await applyPaymentVerification(attempt.id, result, correlationId);
    await getDb().insert(paymentEvents).values({ paymentAttemptId: attempt.id, orderId: attempt.orderId, providerKey, eventType: applied.reviewRequired ? "late_payment_review_required" : `verification_${applied.status}`, deduplicationKey: sha256(`${deduplicationKey}:verification:${applied.status}`), providerEventId: callback.providerEventId || null, correlationId, metadata: { duplicate: applied.duplicate, reviewRequired: applied.reviewRequired } }).onConflictDoNothing();
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
      const applied = await applyPaymentVerification(attempt.id, result, correlationId);
      if (applied.status === "paid") paid += 1;
      if (applied.status === "failed") failed += 1;
    } catch (error) {
      logServer("error", "payment.reconcile.failed", "Payment reconciliation failed", { correlationId, attemptId: attempt.id, orderId: attempt.orderId, provider: provider.key }, error);
    }
  }
  return { examined: attempts.length, paid, failed, skipped: false };
}
