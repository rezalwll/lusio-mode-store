import type { Category, Product } from "@/types/store";
import { rialToToman } from "@/lib/structured-data";
import type { categories, productCategories, productImages, products } from "@/db/schema";

export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type ProductImageRow = typeof productImages.$inferSelect;
export type ProductCategoryRow = typeof productCategories.$inferSelect;

const PRODUCT_STATUSES = ["published", "draft", "archived"] as const;

// DB text has no CHECK for forward flexibility; the adapter validates
// explicitly so unexpected values surface as data-integrity errors.
function toStatus(value: string | null): Product["status"] {
  if (value === null) return undefined;
  if ((PRODUCT_STATUSES as readonly string[]).includes(value)) {
    return value as NonNullable<Product["status"]>;
  }
  throw new Error(`unexpected product status in database: ${value}`);
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    // DB NULL (root) maps back to the domain's 0 convention.
    parent: row.parentId ?? 0,
    image: row.imageUrl,
    active: row.active,
  };
}

export function toProduct(
  row: ProductRow,
  images: ProductImageRow[],
  categorySlugs: string[],
): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.categorySlug,
    categoryName: row.categoryName,
    // Exactly the join-table membership, sorted for determinism (the table
    // carries no positions). The primary category stays available via
    // `category`; every consumer checks it separately, so parity with the
    // source membership is exact.
    categorySlugs: [...new Set(categorySlugs)].sort(),
    price: rialToToman(row.priceRial),
    regularPrice: rialToToman(row.regularPriceRial),
    onSale: row.onSale,
    images: [...images].sort((a, b) => a.position - b.position).map((image) => image.url),
    colors: [...row.colors],
    sizes: [...row.sizes],
    stock: row.stock,
    active: row.active,
    featured: row.featured,
    description: row.description,
    status: toStatus(row.status),
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
  };
}
