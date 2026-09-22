import "dotenv/config";
import { count, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { initialCategories, initialProducts } from "@/lib/catalog";
import { tomanToRial } from "@/lib/structured-data";
import { getDb } from "@/db/client";
import { seedCatalog } from "@/db/seed/catalog";
import { categories, productCategories, productImages, products } from "@/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for database integration tests");

type Db = ReturnType<typeof getDb>;

let db: Db;

async function tableCount(table: typeof products | typeof categories | typeof productImages | typeof productCategories) {
  const rows = await db.select({ n: count() }).from(table);
  return rows[0]?.n ?? 0;
}

beforeAll(() => {
  db = getDb();
});

describe("catalog database foundation (real PostgreSQL)", () => {
  it("has applied migrations recorded in the journal", async () => {
    const rows = (await db.execute(sql`SELECT COUNT(*) AS n FROM drizzle.__drizzle_migrations`)) as unknown as {
      rows: { n: string }[];
    };
    expect(Number(rows.rows[0]?.n)).toBeGreaterThanOrEqual(1);
  });

  it("seeded the full mapped catalog", async () => {
    expect(await tableCount(categories)).toBe(initialCategories.length);
    expect(await tableCount(products)).toBe(initialProducts.length);
  });

  it("seed is idempotent: a second run changes no row counts", async () => {
    const before = {
      categories: await tableCount(categories),
      products: await tableCount(products),
      images: await tableCount(productImages),
      links: await tableCount(productCategories),
    };
    const counts = await seedCatalog(db);
    expect(counts).toEqual({ categories: 18, products: 104, images: 316, links: 114 });
    expect(await tableCount(categories)).toBe(before.categories);
    expect(await tableCount(products)).toBe(before.products);
    expect(await tableCount(productImages)).toBe(before.images);
    expect(await tableCount(productCategories)).toBe(before.links);
  });

  it("stores vans-dior with source name/slug/SKU", async () => {
    const source = initialProducts.find((item) => item.slug === "vans-dior");
    expect(source).toBeDefined();
    const rows = await db.select().from(products).where(sql`${products.slug} = 'vans-dior'`);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe(source?.name);
    expect(rows[0]?.slug).toBe(source?.slug);
    expect(rows[0]?.sku).toBe(source?.sku);
  });

  it("stores prices in IRR exactly (Toman x10)", async () => {
    const source = initialProducts.find((item) => item.slug === "vans-dior");
    const rows = await db.select().from(products).where(sql`${products.slug} = 'vans-dior'`);
    expect(rows[0]?.priceRial).toBe(BigInt(tomanToRial(source?.price ?? 0)));
    expect(rows[0]?.priceRial).toBe(24_980_000n);
    expect(rows[0]?.regularPriceRial).toBe(BigInt(tomanToRial(source?.regularPrice ?? 0)));
  });

  it("preserves deterministic image ordering", async () => {
    const source = initialProducts.find((item) => item.slug === "vans-dior");
    const rows = await db.select().from(productImages).where(sql`${productImages.productId} = ${source?.id ?? 0}`);
    const ordered = [...rows].sort((a, b) => a.position - b.position);
    expect(ordered.map((row) => row.url)).toEqual(source?.images);
  });

  it("links vans-dior to its resolvable category", async () => {
    const source = initialProducts.find((item) => item.slug === "vans-dior");
    const links = await db.select().from(productCategories).where(sql`${productCategories.productId} = ${source?.id ?? 0}`);
    const cats = await db.select().from(categories);
    const slugs = links
      .map((link) => cats.find((category) => category.id === link.categoryId)?.slug)
      .filter(Boolean);
    expect(slugs).toContain("men-shoes-and-boots");
  });

  it("rejects duplicate product slugs", async () => {
    const source = initialProducts[0];
    if (!source) throw new Error("seed data needed");
    await expect(
      db.insert(products).values({
        id: -1,
        slug: source.slug,
        name: "dup",
        sku: "DUP-SKU-1",
        priceRial: 10n,
        regularPriceRial: 10n,
        categorySlug: "uncategorized",
        categoryName: "x",
      }),
    ).rejects.toThrow();
  });

  it("rejects negative stock", async () => {
    await expect(
      db.insert(products).values({
        id: -2,
        slug: "negative-stock-probe",
        name: "probe",
        sku: "DUP-SKU-2",
        priceRial: 10n,
        regularPriceRial: 10n,
        stock: -5,
        categorySlug: "uncategorized",
        categoryName: "x",
      }),
    ).rejects.toThrow();
  });

  it("enforces the category parent foreign key", async () => {
    await expect(
      db.insert(categories).values({ id: -3, slug: "bogus-parent-probe", name: "probe", parentId: 999_999 }),
    ).rejects.toThrow();
    const roots = await db.select().from(categories).where(sql`${categories.parentId} IS NULL`);
    expect(roots.length).toBeGreaterThan(0);
  });
});
