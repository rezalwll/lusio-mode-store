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

  it("returns catalog values compatible with the current mapping", () => {
    // Behavioral contract (no reference identity): a future backing-store
    // swap keeps passing as long as values stay compatible.
    expect(getProducts()).toEqual(initialProducts);
    expect(getCategories()).toEqual(initialCategories);
    expect(getProducts()).toHaveLength(initialProducts.length);
    expect(getCategories()).toHaveLength(initialCategories.length);
    for (const product of getProducts()) {
      expect(product.id).toBeGreaterThan(0);
      expect(product.slug.length).toBeGreaterThan(0);
      expect(product.price).toBeGreaterThanOrEqual(0);
    }
    expect(getCategories().map((category) => category.slug)).toContain("men-shirt");
  });
});
