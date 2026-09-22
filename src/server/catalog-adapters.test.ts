import { describe, expect, it } from "vitest";
import { toCategory, toProduct } from "@/server/catalog-adapters";
import type { CategoryRow, ProductImageRow, ProductRow } from "@/server/catalog-adapters";

const categoryRow: CategoryRow = {
  id: 7,
  slug: "men-shirt",
  name: "پیراهن مردانه",
  description: "desc",
  parentId: null,
  imageUrl: "img",
  active: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const productRow: ProductRow = {
  id: 19276,
  slug: "vans-dior",
  name: "Vans Dior الون",
  sku: "ELV-0001",
  priceRial: 24_980_000n,
  regularPriceRial: 24_980_000n,
  onSale: false,
  colors: ["مشکی"],
  sizes: ["M"],
  stock: 12,
  active: true,
  featured: true,
  description: "desc",
  status: null,
  metaTitle: null,
  metaDescription: null,
  categorySlug: "men-shoes-and-boots",
  categoryName: "کتونی",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const image = (position: number, url: string): ProductImageRow => ({
  id: position,
  productId: 19276,
  position,
  url,
  createdAt: new Date("2026-01-01T00:00:00Z"),
});

describe("toCategory", () => {
  it("maps NULL parent to domain 0 and preserves fields", () => {
    expect(toCategory(categoryRow)).toEqual({
      id: 7,
      slug: "men-shirt",
      name: "پیراهن مردانه",
      description: "desc",
      parent: 0,
      image: "img",
      active: true,
    });
  });

  it("preserves non-null parents", () => {
    expect(toCategory({ ...categoryRow, parentId: 3 }).parent).toBe(3);
  });
});

describe("toProduct", () => {
  it("converts bigint Rial to Toman and orders images by position", () => {
    const product = toProduct(productRow, [image(1, "b"), image(0, "a")], ["men-shoes-and-boots"]);
    expect(product.price).toBe(2_498_000);
    expect(product.regularPrice).toBe(2_498_000);
    expect(product.images).toEqual(["a", "b"]);
    expect(product.categorySlugs).toEqual(["men-shoes-and-boots"]);
    expect(product.status).toBeUndefined();
  });

  it("returns exactly the join-table membership, sorted", () => {
    const product = toProduct(productRow, [], ["other", "men-shoes-and-boots", "other"]);
    expect(product.categorySlugs).toEqual(["men-shoes-and-boots", "other"]);
  });

  it("keeps an empty membership empty even with a primary category", () => {
    const product = toProduct(productRow, [], []);
    expect(product.categorySlugs).toEqual([]);
    expect(product.category).toBe("men-shoes-and-boots");
  });

  it("maps allowed statuses and rejects unexpected values", () => {
    expect(toProduct({ ...productRow, status: "draft" }, [], []).status).toBe("draft");
    expect(() => toProduct({ ...productRow, status: "mystery" }, [], [])).toThrow();
  });

  it("throws on non-divisible Rial money instead of rounding", () => {
    expect(() => toProduct({ ...productRow, priceRial: 24_980_001n }, [], [])).toThrow();
  });
});
