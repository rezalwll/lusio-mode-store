import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/store/use-store";
import type { Product } from "@/types/store";

function mustFindProduct(predicate: (product: Product) => boolean, message: string): Product {
  const product = useStore.getState().products.find(predicate);
  if (!product) throw new Error(message);
  return product;
}

beforeEach(() => {
  localStorage.clear();
  useStore.getState().resetStore();
});

describe("cart baseline", () => {
  it("adds a line and opens the cart", () => {
    const product = mustFindProduct((item) => item.stock > 0, "seed data needs an in-stock product");
    useStore.getState().addToCart({ productId: product.id, size: "M", color: "مشکی", quantity: 2 });

    const { cart, cartOpen } = useStore.getState();
    expect(cart).toEqual([{ productId: product.id, size: "M", color: "مشکی", quantity: Math.min(product.stock, 2) }]);
    expect(cartOpen).toBe(true);
  });

  it("merges repeated adds and applies only the client quantity safety cap", () => {
    const product = mustFindProduct((item) => item.stock > 0, "seed data needs an in-stock product");
    const api = () => useStore.getState();
    api().addToCart({ productId: product.id, size: "L", color: "سفید", quantity: 1 });
    api().addToCart({ productId: product.id, size: "L", color: "سفید", quantity: product.stock + 10 });

    const cart = api().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0]?.quantity).toBe(20);
  });

  it("keeps different sizes as separate lines", () => {
    const product = mustFindProduct((item) => item.stock > 0, "seed data needs an in-stock product");
    const api = () => useStore.getState();
    api().addToCart({ productId: product.id, size: "M", color: "مشکی", quantity: 1 });
    api().addToCart({ productId: product.id, size: "L", color: "مشکی", quantity: 1 });

    expect(api().cart).toHaveLength(2);
  });

  it("updates quantity, applies the client safety cap, and drops zero-quantity lines", () => {
    const product = mustFindProduct((item) => item.stock >= 2, "seed data needs a product with stock >= 2");
    const api = () => useStore.getState();
    api().addToCart({ productId: product.id, size: "M", color: "مشکی", quantity: 1 });

    api().setCartQuantity(product.id, "M", "مشکی", 2);
    expect(api().cart[0]?.quantity).toBe(Math.min(2, product.stock));

    api().setCartQuantity(product.id, "M", "مشکی", product.stock + 50);
    expect(api().cart[0]?.quantity).toBe(20);

    api().setCartQuantity(product.id, "M", "مشکی", 0);
    expect(api().cart).toHaveLength(0);
  });

  it("removes only the matching variant line", () => {
    const product = mustFindProduct((item) => item.stock > 0, "seed data needs an in-stock product");
    const api = () => useStore.getState();
    api().addToCart({ productId: product.id, size: "M", color: "مشکی", quantity: 1 });
    api().addToCart({ productId: product.id, size: "L", color: "مشکی", quantity: 1 });

    api().removeFromCart(product.id, "M", "مشکی");
    expect(api().cart).toEqual([{ productId: product.id, size: "L", color: "مشکی", quantity: 1 }]);
  });

  it("clears the cart and the applied coupon together", () => {
    const product = mustFindProduct((item) => item.stock > 0, "seed data needs an in-stock product");
    const api = () => useStore.getState();
    api().addToCart({ productId: product.id, size: "M", color: "مشکی", quantity: 1 });
    api().setAppliedCoupon("ELEVEN10");

    api().clearCart();
    expect(api().cart).toEqual([]);
    expect(api().appliedCoupon).toBe("");
  });

  it("stores identifiers without treating stale client catalog data as stock authority", () => {
    const api = () => useStore.getState();
    api().addToCart({ productId: 999_999, size: "M", color: "مشکی", quantity: 1 });
    expect(api().cart).toEqual([{ productId: 999_999, size: "M", color: "مشکی", quantity: 1 }]);
  });
});
