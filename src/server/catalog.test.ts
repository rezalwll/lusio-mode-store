import { describe, expect, it } from "vitest";
import { initialCategories, initialProducts } from "@/lib/catalog";
import { getCategories, getCategoryBySlug, getProductBySlug, getProducts } from "@/server/catalog";

describe("server catalog repository", () => {
  it("finds a product by slug with storefront shape", () => {
    const product = getProductBySlug("vans-dior");
    expect(product?.name).toBe("Vans Dior الون");
    expect(product?.price).toBeGreaterThan(0);
  });

  it("returns undefined for unknown product slugs", () => {
    expect(getProductBySlug("no-such-product")).toBeUndefined();
    expect(getProductBySlug("")).toBeUndefined();
  });

  it("finds a category by slug", () => {
    expect(getCategoryBySlug("men-shirt")?.name).toBe("پیراهن مردانه");
  });

  it("returns undefined for unknown category slugs", () => {
    expect(getCategoryBySlug("no-such-category")).toBeUndefined();
  });

  it("stays compatible with the current catalog mapping", () => {
    expect(getProducts()).toBe(initialProducts);
    expect(getCategories()).toBe(initialCategories);
    expect(getProducts().length).toBeGreaterThan(0);
    expect(getCategories().length).toBeGreaterThan(0);
  });
});
