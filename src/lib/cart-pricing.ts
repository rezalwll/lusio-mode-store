import type { Coupon } from "@/types/store";

// Shared cart-discount calculation, used by both CartPage and CheckoutPage.
// Behavior-preserving extraction of the long-standing storefront rule:
// - match an active coupon by applied code, case-insensitively
// - require subtotal >= coupon.minOrder
// - percent coupons round per current behavior, fixed coupons use face value
// - discount never exceeds the subtotal
// Deliberately no expiry/usage-limit/product scoping here: the storefront
// applies those only in the coupon-apply UI, never in the rendered discount.
export function calculateDiscount(coupons: Coupon[], appliedCoupon: string, subtotal: number): number {
  const coupon = coupons.find((item) => item.active && item.code.toLowerCase() === appliedCoupon.toLowerCase());
  if (!coupon || subtotal < coupon.minOrder) return 0;
  const raw = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}
