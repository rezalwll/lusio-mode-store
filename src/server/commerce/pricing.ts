import "server-only";

export interface CouponForPricing {
  type: string;
  percentValue: number | null;
  fixedAmountRial: bigint | null;
  minOrderRial: bigint;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  expiresAt: Date | null;
}

export type CouponEvaluation = { valid: true; discountRial: bigint } | { valid: false; message: string };

export function evaluateCoupon(coupon: CouponForPricing | undefined, subtotalRial: bigint, now = new Date()): CouponEvaluation {
  if (!coupon || !coupon.active) return { valid: false, message: "کد تخفیف معتبر نیست" };
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) return { valid: false, message: "اعتبار این کد تخفیف تمام شده است" };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return { valid: false, message: "سقف استفاده از این کد تخفیف تکمیل شده است" };
  if (subtotalRial < coupon.minOrderRial) return { valid: false, message: "مبلغ سفارش به حداقل خرید این کد نرسیده است" };

  const rawRial = coupon.type === "percent"
    ? (subtotalRial * BigInt(coupon.percentValue ?? 0)) / 100n
    : (coupon.fixedAmountRial ?? 0n);
  // The storefront displays whole Toman amounts. Keep the server result on
  // that exact boundary so Rial→Toman conversion never rounds silently.
  const raw = rawRial - (rawRial % 10n);
  return { valid: true, discountRial: raw > subtotalRial ? subtotalRial : raw };
}

export function shippingCostRial(subtotalRial: bigint, method: string, shippingRial: bigint, freeThresholdRial: bigint) {
  if (method === "تحویل حضوری" || subtotalRial >= freeThresholdRial) return 0n;
  return shippingRial;
}
