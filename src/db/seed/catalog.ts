import { eq } from "drizzle-orm";
import { initialCategories, initialProducts } from "@/lib/catalog";
import { tomanToRial } from "@/lib/structured-data";
import type { Db } from "../client";
import { categories, productCategories, productImages, products } from "../schema";

export interface SeedCounts {
  categories: number;
  products: number;
  images: number;
  links: number;
}

// Deterministic catalog seed from the current mapped catalog source.
// Runs inside one transaction; safe to execute repeatedly:
// - categories/products upsert by stable numeric id (values refreshed)
// - images and category links are rebuilt per product (scoped deletes +
//   ordered inserts), so reruns never duplicate rows
// - money converts Toman → IRR explicitly; nothing else is transformed
export async function seedCatalog(db: Db): Promise<SeedCounts> {
  const categoryIdBySlug = new Map<string, number>();
  for (const category of initialCategories) {
    categoryIdBySlug.set(category.slug, category.id);
  }
  const unresolved = new Set<string>();
  for (const product of initialProducts) {
    for (const slug of product.categorySlugs) {
      if (!categoryIdBySlug.has(slug)) unresolved.add(slug);
    }
  }
  if (unresolved.size > 0) {
    throw new Error(`seed refuses to drop category relations: ${[...unresolved].join(", ")}`);
  }

  return db.transaction(async (tx) => {
    // Roots first (parent 0 → NULL), then children: max depth is 1.
    const ordered = [...initialCategories].sort((a, b) => Number(a.parent !== 0) - Number(b.parent !== 0));
    for (const category of ordered) {
      await tx
        .insert(categories)
        .values({
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
          parentId: category.parent === 0 ? null : category.parent,
          imageUrl: category.image,
          active: category.active,
        })
        .onConflictDoUpdate({
          target: categories.id,
          set: {
            slug: category.slug,
            name: category.name,
            description: category.description,
            parentId: category.parent === 0 ? null : category.parent,
            imageUrl: category.image,
            active: category.active,
            updatedAt: new Date(),
          },
        });
    }

    let images = 0;
    let links = 0;
    for (const product of initialProducts) {
      await tx
        .insert(products)
        .values({
          id: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          priceRial: BigInt(tomanToRial(product.price)),
          regularPriceRial: BigInt(tomanToRial(product.regularPrice)),
          onSale: product.onSale,
          colors: product.colors,
          sizes: product.sizes,
          stock: product.stock,
          active: product.active,
          featured: product.featured,
          description: product.description,
          status: product.status ?? null,
          metaTitle: product.metaTitle ?? null,
          metaDescription: product.metaDescription ?? null,
          categorySlug: product.category,
          categoryName: product.categoryName,
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            slug: product.slug,
            name: product.name,
            sku: product.sku,
            priceRial: BigInt(tomanToRial(product.price)),
            regularPriceRial: BigInt(tomanToRial(product.regularPrice)),
            onSale: product.onSale,
            colors: product.colors,
            sizes: product.sizes,
            stock: product.stock,
            active: product.active,
            featured: product.featured,
            description: product.description,
            status: product.status ?? null,
            metaTitle: product.metaTitle ?? null,
            metaDescription: product.metaDescription ?? null,
            categorySlug: product.category,
            categoryName: product.categoryName,
            updatedAt: new Date(),
          },
        });

      await tx.delete(productImages).where(eq(productImages.productId, product.id));
      const urls = [...new Set(product.images)];
      for (const [position, url] of urls.entries()) {
        await tx.insert(productImages).values({ productId: product.id, position, url });
        images += 1;
      }

      await tx.delete(productCategories).where(eq(productCategories.productId, product.id));
      const categoryIds = [...new Set(product.categorySlugs.map((slug) => categoryIdBySlug.get(slug) as number))];
      for (const categoryId of categoryIds) {
        await tx.insert(productCategories).values({ productId: product.id, categoryId });
        links += 1;
      }
    }

    return { categories: initialCategories.length, products: initialProducts.length, images, links };
  });
}
