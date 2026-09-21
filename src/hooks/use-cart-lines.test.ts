import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartLines } from "@/hooks/use-cart-lines";
import { useStore } from "@/store/use-store";

beforeEach(() => {
  localStorage.clear();
  useStore.getState().resetStore();
});

describe("useCartLines", () => {
  it("derives line totals, subtotal, and count from live product prices", () => {
    const api = () => useStore.getState();
    const stocked = api().products.filter((item) => item.stock > 0);
    const first = stocked[0];
    const second = stocked[1];
    if (!first || !second) throw new Error("seed data needs at least two in-stock products");
    api().addToCart({ productId: first.id, size: "M", color: "مشکی", quantity: Math.min(2, first.stock) });
    api().addToCart({ productId: second.id, size: "L", color: "سفید", quantity: 1 });

    const { result } = renderHook(() => useCartLines());
    const expectedSubtotal = result.current.lines.reduce((sum, line) => sum + line.total, 0);
    for (const line of result.current.lines) {
      expect(line.total).toBe(line.unitPrice * line.quantity);
    }
    expect(result.current.subtotal).toBe(expectedSubtotal);
    expect(result.current.count).toBe(result.current.lines.reduce((sum, line) => sum + line.quantity, 0));
  });

  it("skips cart lines whose product no longer exists", () => {
    const api = () => useStore.getState();
    const first = api().products.find((item) => item.stock > 0);
    if (!first) throw new Error("seed data needs at least one in-stock product");
    api().addToCart({ productId: first.id, size: "M", color: "مشکی", quantity: 1 });
    api().deleteProduct(first.id);

    const { result } = renderHook(() => useCartLines());
    expect(result.current.lines).toEqual([]);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.count).toBe(0);
  });
});
