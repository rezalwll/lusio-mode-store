"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { coupons } from "@/db/schema";
import { rialToToman, tomanToRial } from "@/lib/structured-data";
import { getProducts } from "@/server/catalog";
import { CommerceError, createOrder } from "@/server/commerce/orders";
import { evaluateCoupon, shippingCostRial } from "@/server/commerce/pricing";
import { assertSameOrigin } from "@/server/security/origin";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { getRequestSource } from "@/server/security/request-source";
import { getStoreSettings } from "@/server/store-settings";
import { notifyOrderCreated } from "@/server/messaging/service";
import { logServer } from "@/server/observability/logger";
import { cartQuoteInputSchema, checkoutInputSchema, type CartQuoteInput } from "@/server/validation/checkout";

export type CheckoutQuoteResult = { ok: true; subtotal: number; discount: number; shipping: number; total: number; couponCode: string } | { ok: false; message: string };
export type CheckoutResult = { ok: true; orderId: string; total: number; paymentStatus: "pending"; trackingToken?: string } | { ok: false; message: string };

export async function quoteCartAction(input: CartQuoteInput): Promise<CheckoutQuoteResult> {
  const parsed = cartQuoteInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "سبد خرید معتبر نیست" };
  const [catalog, settings] = await Promise.all([getProducts(), getStoreSettings()]);
  const productById = new Map(catalog.map((product) => [product.id, product]));
  let subtotalRial = 0n;
  for (const line of parsed.data.lines) {
    const product = productById.get(line.productId);
    if (!product?.active) return { ok: false, message: "یکی از محصولات سبد قابل سفارش نیست" };
    const variant = product.variants?.find((item) => item.size === line.size && item.color === line.color);
    const available = product.variants?.length ? variant?.stock ?? 0 : product.stock;
    if (available < line.quantity) return { ok: false, message: `موجودی «${product.name}» کافی نیست` };
    subtotalRial += BigInt(tomanToRial(product.price)) * BigInt(line.quantity);
  }

  let discountRial = 0n;
  const couponCode = parsed.data.couponCode.trim().toUpperCase();
  if (couponCode) {
    const [coupon] = await getDb().select().from(coupons).where(eq(coupons.code, couponCode)).limit(1);
    const evaluation = evaluateCoupon(coupon, subtotalRial);
    if (!evaluation.valid) return { ok: false, message: evaluation.message };
    discountRial = evaluation.discountRial;
  }
  const shippingRial = shippingCostRial(subtotalRial, parsed.data.shippingMethod, BigInt(tomanToRial(settings.shippingCost)), BigInt(tomanToRial(settings.freeShippingThreshold)));
  return {
    ok: true,
    subtotal: rialToToman(subtotalRial),
    discount: rialToToman(discountRial),
    shipping: rialToToman(shippingRial),
    total: rialToToman(subtotalRial - discountRial + shippingRial),
    couponCode,
  };
}

export async function placeOrderAction(input: unknown): Promise<CheckoutResult> {
  await assertSameOrigin();
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اطلاعات سفارش معتبر نیست" };
  const source = await getRequestSource();
  const limit = await consumeRateLimit(`checkout:${source}:${parsed.data.phone}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) return { ok: false, message: `تعداد تلاش‌ها بیش از حد است؛ ${limit.retryAfterSeconds} ثانیه دیگر تلاش کنید.` };
  try {
    const result = await createOrder(parsed.data);
    if (!result.reused) {
      await notifyOrderCreated({ phone: parsed.data.phone, orderId: result.orderId, totalRial: result.totalRial });
    }
    revalidatePath("/admin", "layout");
    return { ok: true, orderId: result.orderId, total: rialToToman(result.totalRial), paymentStatus: "pending", trackingToken: result.trackingToken };
  } catch (error) {
    if (error instanceof CommerceError) return { ok: false, message: error.publicMessage };
    logServer("error", "checkout.create.failed", "Checkout failed", { source }, error);
    return { ok: false, message: "ثبت سفارش انجام نشد؛ دوباره تلاش کنید" };
  }
}
