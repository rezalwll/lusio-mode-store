// @vitest-environment node

import { describe, expect, it } from "vitest";
import { evaluateCoupon, shippingCostRial, type CouponForPricing } from "./pricing";

const coupon: CouponForPricing = { type: "percent", percentValue: 10, fixedAmountRial: null, minOrderRial: 10_000n, usageLimit: 10, usedCount: 2, active: true, expiresAt: new Date("2030-01-01") };

describe("evaluateCoupon", () => {
  it("calculates integer Rial discounts and caps fixed discounts", () => {
    expect(evaluateCoupon(coupon, 50_000n, new Date("2028-01-01"))).toEqual({ valid: true, discountRial: 5_000n });
    expect(evaluateCoupon({ ...coupon, type: "fixed", percentValue: null, fixedAmountRial: 80_000n }, 50_000n, new Date("2028-01-01"))).toEqual({ valid: true, discountRial: 50_000n });
    expect(evaluateCoupon({ ...coupon, percentValue: 15, minOrderRial: 0n }, 1010n, new Date("2028-01-01"))).toEqual({ valid: true, discountRial: 150n });
  });

  it("rejects expired, exhausted and under-minimum coupons", () => {
    expect(evaluateCoupon({ ...coupon, expiresAt: new Date("2020-01-01") }, 50_000n).valid).toBe(false);
    expect(evaluateCoupon({ ...coupon, usedCount: 10 }, 50_000n, new Date("2028-01-01")).valid).toBe(false);
    expect(evaluateCoupon(coupon, 9_999n, new Date("2028-01-01")).valid).toBe(false);
  });
});

describe("shippingCostRial", () => {
  it("applies free-shipping threshold and pickup", () => {
    expect(shippingCostRial(99n, "پست پیشتاز", 20n, 100n)).toBe(20n);
    expect(shippingCostRial(100n, "پست پیشتاز", 20n, 100n)).toBe(0n);
    expect(shippingCostRial(1n, "تحویل حضوری", 20n, 100n)).toBe(0n);
  });
});
