import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { initialCategories, initialProducts } from "@/lib/catalog";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { fetchProducts } from "@/server/catalog-queries";
import { getCategories, getCategoryBySlug, getProductBySlug, getProducts } from "@/server/catalog";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for database integration tests");

describe("catalog PostgreSQL parity (static mapped catalog is the oracle)", () => {
  it("returns all 104 products with exact domain fields", async () => {
    const fromDb = await getProducts();
    expect(fromDb).toHaveLength(initialProducts.length);
    expect(fromDb).toHaveLength(104);
    for (const source of initialProducts) {
      const actual = fromDb.find((item) => item.id === source.id);
      expect(actual, `product ${source.id} missing`).toBeDefined();
      if (!actual) continue;
      expect(actual.slug).toBe(source.slug);
      expect(actual.name).toBe(source.name);
      expect(actual.sku).toBe(source.sku);
      expect(actual.price).toBe(source.price);
      expect(actual.regularPrice).toBe(source.regularPrice);
      expect(actual.onSale).toBe(source.onSale);
      expect(actual.stock).toBe(source.stock);
      expect(actual.active).toBe(source.active);
      expect(actual.featured).toBe(source.featured);
      expect(actual.colors).toEqual(source.colors);
      expect(actual.sizes).toEqual(source.sizes);
      expect(actual.images).toEqual(source.images);
      expect(actual.category).toBe(source.category);
      expect(actual.categoryName).toBe(source.categoryName);
      expect(new Set(actual.categorySlugs)).toEqual(new Set(source.categorySlugs));
      expect(actual.description).toBe(source.description);
      expect(actual.status).toBe(source.status);
      expect(actual.metaTitle).toBe(source.metaTitle);
      expect(actual.metaDescription).toBe(source.metaDescription);
      expect(actual.variants).toBeUndefined();
    }
  });

  it("returns all 18 categories with parent NULL→0 round-trip", async () => {
    const fromDb = await getCategories();
    expect(fromDb).toHaveLength(initialCategories.length);
    expect(fromDb).toHaveLength(18);
    for (const source of initialCategories) {
      const actual = fromDb.find((item) => item.id === source.id);
      expect(actual, `category ${source.id} missing`).toBeDefined();
      if (!actual) continue;
      expect(actual.slug).toBe(source.slug);
      expect(actual.name).toBe(source.name);
      expect(actual.description).toBe(source.description);
      expect(actual.parent).toBe(source.parent);
      expect(actual.image).toBe(source.image);
      expect(actual.active).toBe(source.active);
    }
  });

  it("looks up records by slug and misses unknown slugs", async () => {
    expect((await getProductBySlug("vans-dior"))?.name).toBe("Vans Dior الون");
    expect(await getProductBySlug("no-such-product")).toBeUndefined();
    expect((await getCategoryBySlug("men-shirt"))?.name).toBe("پیراهن مردانه");
    expect(await getCategoryBySlug("no-such-category")).toBeUndefined();
  });

  it("returns the live Postgres value, proving no static fallback", async () => {
    const db = getDb();
    const [before] = await db.select().from(schema.products).where(eq(schema.products.slug, "vans-dior"));
    if (!before) throw new Error("seed data needed");
    const probeName = `parity-probe-${Date.now()}`;
    try {
      await db.update(schema.products).set({ name: probeName }).where(eq(schema.products.id, before.id));
      expect((await getProductBySlug("vans-dior"))?.name).toBe(probeName);
    } finally {
      await db.update(schema.products).set({ name: before.name }).where(eq(schema.products.id, before.id));
    }
    expect((await getProductBySlug("vans-dior"))?.name).toBe(before.name);
  });

  it("surfaces DB failures as errors, never empty data", async () => {
    // Closed loopback port refuses instantly: deterministic, no timeout flake.
    const deadPool = new Pool({
      connectionString: "postgresql://postgres:postgres@127.0.0.1:59999/lusio_test",
      connectionTimeoutMillis: 3000,
    });
    try {
      const dead = drizzle(deadPool, { schema });
      await expect(fetchProducts(dead)).rejects.toThrow();
    } finally {
      await deadPool.end();
    }
  });
});
