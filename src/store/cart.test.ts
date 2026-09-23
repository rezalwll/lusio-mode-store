import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/store/use-store";

beforeEach(() => { localStorage.clear(); useStore.getState().resetStore(); });

describe("client cart identifiers", () => {
  it("adds a line and opens the cart", () => {
    useStore.getState().addToCart({ productId: 10, size: "M", color: "مشکی", quantity: 2 });
    expect(useStore.getState().cart).toEqual([{ productId: 10, size: "M", color: "مشکی", quantity: 2 }]);
    expect(useStore.getState().cartOpen).toBe(true);
  });

  it("merges exact variants, separates other variants, and caps UI quantity", () => {
    const api = () => useStore.getState();
    api().addToCart({ productId: 10, size: "M", color: "مشکی", quantity: 12 });
    api().addToCart({ productId: 10, size: "M", color: "مشکی", quantity: 12 });
    api().addToCart({ productId: 10, size: "L", color: "مشکی", quantity: 1 });
    expect(api().cart).toEqual([
      { productId: 10, size: "M", color: "مشکی", quantity: 20 },
      { productId: 10, size: "L", color: "مشکی", quantity: 1 },
    ]);
  });

  it("updates, removes, and clears cart-only state", () => {
    const api = () => useStore.getState();
    api().addToCart({ productId: 10, size: "M", color: "مشکی", quantity: 1 });
    api().setCartQuantity(10, "M", "مشکی", 4);
    expect(api().cart[0]?.quantity).toBe(4);
    api().setAppliedCoupon(" eleven10 ");
    expect(api().appliedCoupon).toBe("ELEVEN10");
    api().clearCart();
    expect(api().cart).toEqual([]);
    expect(api().appliedCoupon).toBe("");
  });

  it("does not pretend client catalog data is stock authority", () => {
    useStore.getState().addToCart({ productId: 999_999, size: "M", color: "مشکی", quantity: 1 });
    expect(useStore.getState().cart).toHaveLength(1);
  });
});

