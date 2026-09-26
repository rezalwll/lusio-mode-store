"use server";

import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { customerOtpChallenges, customers } from "@/db/schema";
import { sendOtpMessage } from "@/server/messaging/service";
import { createCorrelationId } from "@/server/observability/correlation";
import { logServer } from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/origin";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { getRequestSource } from "@/server/security/request-source";
import { normalizeIranPhone } from "@/server/validation/checkout";
import { createCustomerSession, destroyCustomerSession } from "./customer-session";

const OTP_TTL_MS = 5 * 60 * 1000;

function otpHash(challengeId: string, phone: string, code: string) {
  const secret = process.env.OTP_HASH_SECRET || (process.env.NODE_ENV === "production" ? "" : "development-only-secret");
  if (!secret) throw new Error("OTP_HASH_SECRET is required in production");
  return createHash("sha256").update(`${challengeId}:${phone}:${code}:${secret}`).digest();
}

function sameHash(left: Buffer, rightHex: string) {
  const right = Buffer.from(rightHex, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function requestCustomerOtpAction(input: { phone: string }): Promise<{ ok: true; challengeId: string } | { ok: false; message: string }> {
  await assertSameOrigin();
  const phone = normalizeIranPhone(input.phone);
  if (!/^09\d{9}$/.test(phone)) return { ok: false, message: "شماره موبایل معتبر نیست" };
  const source = await getRequestSource();
  const correlationId = createCorrelationId();
  const limit = await consumeRateLimit(`customer-otp-request:${source}:${phone}`, 3, 10 * 60 * 1000);
  if (!limit.allowed) return { ok: false, message: `درخواست‌های ورود بیش از حد است؛ ${limit.retryAfterSeconds} ثانیه دیگر تلاش کنید.` };
  const challengeId = randomUUID();
  const code = String(randomInt(100_000, 1_000_000));
  try {
    await getDb().insert(customerOtpChallenges).values({ id: challengeId, phone, codeHash: otpHash(challengeId, phone, code).toString("hex"), expiresAt: new Date(Date.now() + OTP_TTL_MS) });
    const delivery = await sendOtpMessage(phone, code);
    if (!delivery.ok) throw new Error(delivery.message);
    return { ok: true, challengeId };
  } catch (error) {
    await getDb().delete(customerOtpChallenges).where(eq(customerOtpChallenges.id, challengeId)).catch(() => undefined);
    logServer("error", "auth.otp.delivery_failed", "OTP delivery failed", { correlationId, source }, error);
    return { ok: false, message: "ارسال کد ورود انجام نشد؛ تنظیمات پیامک را بررسی کنید" };
  }
}

export async function verifyCustomerOtpAction(input: { phone: string; challengeId: string; code: string }): Promise<{ ok: true } | { ok: false; message: string }> {
  await assertSameOrigin();
  const phone = normalizeIranPhone(input.phone);
  if (!/^09\d{9}$/.test(phone) || !/^[0-9]{6}$/.test(input.code) || !/^[0-9a-f-]{36}$/i.test(input.challengeId)) return { ok: false, message: "کد ورود معتبر نیست" };
  const limit = await consumeRateLimit(`customer-otp-verify:${await getRequestSource()}:${phone}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) return { ok: false, message: "تلاش‌های ناموفق بیش از حد است؛ بعداً دوباره امتحان کنید" };

  const result = await getDb().transaction(async (tx) => {
    const [challenge] = await tx.select().from(customerOtpChallenges).where(and(eq(customerOtpChallenges.id, input.challengeId), eq(customerOtpChallenges.phone, phone), isNull(customerOtpChallenges.consumedAt), gt(customerOtpChallenges.expiresAt, new Date()))).for("update").limit(1);
    if (!challenge || challenge.attempts >= 5) return { ok: false as const, message: "کد ورود منقضی یا نامعتبر است" };
    if (!sameHash(otpHash(challenge.id, phone, input.code), challenge.codeHash)) {
      await tx.update(customerOtpChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(customerOtpChallenges.id, challenge.id));
      return { ok: false as const, message: "کد ورود صحیح نیست" };
    }
    const [customer] = await tx.select().from(customers).where(and(eq(customers.phone, phone), eq(customers.active, true))).limit(1);
    if (!customer) return { ok: false as const, message: "برای این شماره حساب فعالی وجود ندارد" };
    await tx.update(customerOtpChallenges).set({ consumedAt: new Date() }).where(eq(customerOtpChallenges.id, challenge.id));
    await tx.update(customers).set({ phoneVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(customers.id, customer.id));
    return { ok: true as const, customerId: customer.id };
  });
  if (!result.ok) return result;
  await createCustomerSession(result.customerId);
  return { ok: true };
}

export async function logoutCustomerAction() {
  await assertSameOrigin();
  await destroyCustomerSession();
}
