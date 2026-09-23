import { beforeEach, describe, expect, it } from "vitest";
import { calculateDiscount } from "@/lib/cart-pricing";
import { useStore } from "@/store/use-store";

function discountFor(subtotal: number): number {
  const { coupons, appliedCoupon } = useStore.getState();
  return calculateDiscount(coupons, appliedCoupon, subtotal);
}

beforeEach(() => {
  localStorage.clear();
  useStore.getState().resetStore();
});

describe("cart-pricing discount baseline", () => {
  it("applies the active ELEVEN10 percent coupon above its minimum order", () => {
    useStore.getState().setAppliedCoupon("eleven10");
    expect(useStore.getState().appliedCoupon).toBe("eleven10");
    expect(discountFor(2_000_000)).toBe(200_000);
  });

  it("rounds percentage math per the storefront rule", () => {
    useStore.getState().setAppliedCoupon("ELEVEN10");
    expect(discountFor(1_555_555)).toBe(Math.round((1_555_555 * 10) / 100));
  });

  it("applies the active FIRSTBUY fixed coupon above its minimum order", () => {
    useStore.getState().setAppliedCoupon("FIRSTBUY");
    expect(discountFor(2_500_000)).toBe(300_000);
  });

  it("grants no discount below the coupon minimum order", () => {
    useStore.getState().setAppliedCoupon("ELEVEN10");
    expect(discountFor(1_000_000)).toBe(0);
  });

  it("rejects unknown codes and inactive coupons", () => {
    const api = () => useStore.getState();
    api().setAppliedCoupon("NOT-A-CODE");
    expect(discountFor(5_000_000)).toBe(0);
    api().setAppliedCoupon("SUMMER20");
    expect(discountFor(5_000_000)).toBe(0);
    api().setAppliedCoupon("");
    expect(discountFor(5_000_000)).toBe(0);
  });

  it("caps a fixed discount at the subtotal", () => {
    useStore.getState().saveCoupon({
      id: 999,
      code: "BIGFIXED",
      type: "fixed",
      value: 500_000,
      minOrder: 100_000,
      usageLimit: 10,
      used: 0,
      expiresAt: "2027-01-01",
      active: true,
    });
    useStore.getState().setAppliedCoupon("BIGFIXED");
    expect(discountFor(200_000)).toBe(200_000);
  });

  it("clears the applied coupon together with the cart", () => {
    const api = () => useStore.getState();
    api().setAppliedCoupon("ELEVEN10");
    api().clearCart();
    expect(api().appliedCoupon).toBe("");
    expect(discountFor(5_000_000)).toBe(0);
  });
});
