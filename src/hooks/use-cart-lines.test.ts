import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartLines } from "@/hooks/use-cart-lines";
import { initialProducts } from "@/lib/catalog";
import { useStore } from "@/store/use-store";

beforeEach(() => { localStorage.clear(); useStore.getState().resetStore(); });

describe("useCartLines", () => {
  it("derives display totals from current server-provided products", () => {
    const [first, second] = initialProducts.filter((product) => product.stock > 0);
    if (!first || !second) throw new Error("catalog fixture requires in-stock products");
    useStore.getState().addToCart({ productId: first.id, size: first.sizes[0] || "M", color: first.colors[0] || "مشکی", quantity: 2 });
    useStore.getState().addToCart({ productId: second.id, size: second.sizes[0] || "L", color: second.colors[0] || "سفید", quantity: 1 });
    const { result } = renderHook(() => useCartLines(initialProducts));
    expect(result.current.subtotal).toBe(result.current.lines.reduce((sum, line) => sum + line.total, 0));
    expect(result.current.count).toBe(3);
  });

  it("drops stale identifiers that are absent from the server catalog", () => {
    useStore.getState().addToCart({ productId: 999_999, size: "M", color: "مشکی", quantity: 1 });
    const { result } = renderHook(() => useCartLines(initialProducts));
    expect(result.current.lines).toEqual([]);
  });
});
