"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { orderItems, orders } from "@/db/schema";
import { rialToToman } from "@/lib/structured-data";
import { getCustomerSession } from "@/server/auth/customer-session";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { normalizeIranPhone } from "@/server/validation/checkout";
import type { OrderStatus, PaymentStatus } from "@/types/store";

export interface TrackingResult {
  id: string; customerName: string; createdAt: string; total: number; status: OrderStatus; paymentStatus: PaymentStatus;
  shippingMethod: string; trackingCode?: string; itemsCount: number;
}

function hashToken(token: string) { return createHash("sha256").update(token).digest(); }
function tokenMatches(token: string, expectedHex: string) {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = hashToken(token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function trackOrderAction(input: { orderId: string; phone?: string; token?: string }): Promise<{ ok: true; order: TrackingResult } | { ok: false; message: string }> {
  const orderId = input.orderId.trim().toUpperCase();
  const phone = input.phone ? normalizeIranPhone(input.phone) : "";
  const token = input.token?.trim() || "";
  if (!/^EL-[A-Z0-9-]{5,70}$/.test(orderId) || (phone && !/^09\d{9}$/.test(phone)) || token.length > 200) return { ok: false, message: "اطلاعات پیگیری معتبر نیست" };
  const source = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = consumeRateLimit(`tracking:${source}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) return { ok: false, message: "تعداد درخواست‌های پیگیری بیش از حد است" };

  const [order] = await getDb().select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const session = await getCustomerSession();
  const authorized = Boolean(order) && ((token && tokenMatches(token, order.publicTokenHash)) || (phone && phone === order.phone) || (session && session.id === order.customerId));
  if (!order || !authorized) return { ok: false, message: "سفارشی با این مشخصات پیدا نشد" };
  const [count] = await getDb().select({ quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` }).from(orderItems).where(eq(orderItems.orderId, order.id));
  return { ok: true, order: {
    id: order.id, customerName: order.customerName, createdAt: order.createdAt.toISOString(), total: rialToToman(order.totalRial),
    status: order.status as OrderStatus, paymentStatus: order.paymentStatus as PaymentStatus, shippingMethod: order.shippingMethod,
    trackingCode: order.trackingCode ?? undefined, itemsCount: count?.quantity ?? 0,
  } };
}
