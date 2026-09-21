import { describe, expect, it } from "vitest";
import rawProducts from "../../assets/data/store-products.json";
import rawProductsExtra from "../../assets/data/store-products-2.json";
import { initialCategories, initialProducts } from "@/lib/catalog";

type RawStock = { id?: number; is_in_stock?: boolean };

describe("catalog product mapping", () => {
  it("maps products from both JSON sources with unique ids", () => {
    expect(initialProducts.length).toBeGreaterThan(12);
    const ids = initialProducts.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => Number.isInteger(id) && id > 0)).toBe(true);
  });

  it("guarantees usable slug, name, and sku for every product", () => {
    for (const product of initialProducts) {
      expect(product.slug.length).toBeGreaterThan(0);
      expect(product.name.length).toBeGreaterThan(0);
      expect(product.sku.length).toBeGreaterThan(0);
    }
  });

  it("keeps price mapping stable (sale price never exceeds regular price)", () => {
    for (const product of initialProducts) {
      expect(product.price).toBeGreaterThanOrEqual(0);
      expect(product.regularPrice).toBeGreaterThanOrEqual(product.price);
    }
  });

  it("populates images, colors, and sizes as arrays", () => {
    for (const product of initialProducts) {
      expect(Array.isArray(product.images)).toBe(true);
      expect(Array.isArray(product.colors)).toBe(true);
      expect(Array.isArray(product.sizes)).toBe(true);
      expect(new Set(product.images).size).toBe(product.images.length);
    }
  });

  it("always resolves a category with a display name", () => {
    for (const product of initialProducts) {
      expect(product.category.length).toBeGreaterThan(0);
      expect(product.categoryName.length).toBeGreaterThan(0);
    }
  });

  it("marks the first twelve mapped products as featured", () => {
    expect(initialProducts.slice(0, 12).every((product) => product.featured)).toBe(true);
    expect(initialProducts[12]?.featured).toBe(false);
  });

  it("maps out-of-stock raws to zero stock and keeps everything else stocked", () => {
    // DEMO BASELINE BEHAVIOR — TO BE REPLACED BY SERVER INVENTORY:
    // in-stock items without an explicit low-stock count receive a
    // deterministic fabricated fallback (12 + index % 19), so tests only
    // assert the stock/no-stock boundary, never exact fabricated values.
    const rawById = new Map<number, RawStock>();
    for (const raw of [...(rawProducts as RawStock[]), ...(rawProductsExtra as RawStock[])]) {
      if (typeof raw.id === "number" && !rawById.has(raw.id)) rawById.set(raw.id, raw);
    }
    for (const product of initialProducts) {
      expect(product.stock).toBeGreaterThanOrEqual(0);
      const raw = rawById.get(product.id);
      if (raw?.is_in_stock === false) {
        expect(product.stock).toBe(0);
      } else {
        expect(product.stock).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("catalog category mapping", () => {
  it("maps categories with unique ids and usable slugs", () => {
    expect(initialCategories.length).toBeGreaterThan(0);
    const ids = initialCategories.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const category of initialCategories) {
      expect(category.slug.length).toBeGreaterThan(0);
      expect(category.name.length).toBeGreaterThan(0);
    }
  });
});
