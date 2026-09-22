import "server-only";

import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, productCategories, productImages, products } from "@/db/schema";
import { toCategory, toProduct } from "./catalog-adapters";

// Bounded query strategy: lists read each table once (products, images,
// links, categories) and group in memory — never one query per product.
// Targeted slug lookups fetch one product plus its own rows.
export async function fetchProducts(db: Db) {
  const [productRows, imageRows, linkRows, categoryRows] = await Promise.all([
    db.select().from(products),
    db.select().from(productImages),
    db.select().from(productCategories),
    db.select().from(categories),
  ]);
  const slugByCategoryId = new Map(categoryRows.map((category) => [category.id, category.slug]));
  const imagesByProduct = new Map<number, typeof imageRows>();
  for (const image of imageRows) {
    const list = imagesByProduct.get(image.productId) ?? [];
    list.push(image);
    imagesByProduct.set(image.productId, list);
  }
  const slugsByProduct = new Map<number, string[]>();
  for (const link of linkRows) {
    const slug = slugByCategoryId.get(link.categoryId);
    if (slug === undefined) throw new Error(`product_categories references missing category ${link.categoryId}`);
    const list = slugsByProduct.get(link.productId) ?? [];
    list.push(slug);
    slugsByProduct.set(link.productId, list);
  }
  return productRows.map((row) =>
    toProduct(row, imagesByProduct.get(row.id) ?? [], slugsByProduct.get(row.id) ?? []),
  );
}

export async function fetchProductBySlug(db: Db, slug: string) {
  const rows = await db.select().from(products).where(eq(products.slug, slug));
  const row = rows[0];
  if (!row || !row.active) return undefined;
  const [images, links, categoryRows] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, row.id)).orderBy(asc(productImages.position)),
    db.select().from(productCategories).where(eq(productCategories.productId, row.id)),
    db.select().from(categories),
  ]);
  const slugByCategoryId = new Map(categoryRows.map((category) => [category.id, category.slug]));
  const slugs: string[] = [];
  for (const link of links) {
    const slug = slugByCategoryId.get(link.categoryId);
    if (slug === undefined) throw new Error(`product_categories references missing category ${link.categoryId}`);
    slugs.push(slug);
  }
  return toProduct(row, images, slugs);
}

export async function fetchCategories(db: Db) {
  const rows = await db.select().from(categories).orderBy(asc(categories.id));
  return rows.map(toCategory);
}

export async function fetchCategoryBySlug(db: Db, slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug));
  const row = rows[0];
  if (!row || !row.active) return undefined;
  return toCategory(row);
}
