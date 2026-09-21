import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/store/use-store";

// Pricing semantics mirror the CURRENT CartPage/CheckoutPage rule:
// an active coupon matched case-insensitively applies only above its
// minimum order, as min(percent ? round(subtotal * value / 100) : value, subtotal).
function currentDiscount(subtotal: number): number {
  const { coupons, appliedCoupon } = useStore.getState();
  const coupon = coupons.find((item) => item.active && item.code.toLowerCase() === appliedCoupon.toLowerCase());
  if (!coupon || subtotal < coupon.minOrder) return 0;
  const raw = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}

beforeEach(() => {
  localStorage.clear();
  const api = useStore.getState();
  api.resetStore();
  // resetStore intentionally leaves the admin session flag untouched
  // (current store behavior), so tests reset it explicitly for isolation.
  api.logoutAdmin();
});

describe("coupon baseline", () => {
  it("applies the active ELEVEN10 percent coupon above its minimum order", () => {
    useStore.getState().setAppliedCoupon("eleven10");
    expect(useStore.getState().appliedCoupon).toBe("eleven10");
    expect(currentDiscount(2_000_000)).toBe(200_000);
  });

  it("applies the active FIRSTBUY fixed coupon above its minimum order", () => {
    useStore.getState().setAppliedCoupon("FIRSTBUY");
    expect(currentDiscount(2_500_000)).toBe(300_000);
  });

  it("grants no discount below the coupon minimum order", () => {
    useStore.getState().setAppliedCoupon("ELEVEN10");
    expect(currentDiscount(1_000_000)).toBe(0);
  });

  it("rejects unknown codes and inactive coupons", () => {
    const { coupons } = useStore.getState();
    const lookup = (code: string) =>
      coupons.find((item) => item.active && item.code.toLowerCase() === code.toLowerCase());
    expect(lookup("NOT-A-CODE")).toBeUndefined();
    expect(lookup("SUMMER20")).toBeUndefined();
    expect(lookup("")).toBeUndefined();
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
    expect(currentDiscount(200_000)).toBe(200_000);
  });
});

describe("DEMO-ONLY BASELINE — REMOVE IN AUTH PHASE: admin login", () => {
  it("authenticates with the demo password", () => {
    expect(useStore.getState().loginAdmin("eleven1405")).toBe(true);
    expect(useStore.getState().adminAuthenticated).toBe(true);
  });

  it("rejects a wrong password without authenticating", () => {
    expect(useStore.getState().loginAdmin("wrong-password")).toBe(false);
    expect(useStore.getState().adminAuthenticated).toBe(false);
  });

  it("logs out back to unauthenticated", () => {
    const api = () => useStore.getState();
    api().loginAdmin("eleven1405");
    api().logoutAdmin();
    expect(api().adminAuthenticated).toBe(false);
  });
});
