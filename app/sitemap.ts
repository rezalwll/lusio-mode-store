import type { MetadataRoute } from "next";
import { canonical } from "@/lib/site";
import { getCategories, getProducts } from "@/server/catalog";

// Served on demand: the catalog lives in PostgreSQL, so this route must not
// execute during `next build` (which runs without DATABASE_URL).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return [
    { url: canonical("/"), priority: 1.0 },
    { url: canonical("/shop"), priority: 0.9 },
    ...categories
      .filter((category) => category.active)
      .map((category) => ({ url: canonical(`/category/${category.slug}`), priority: 0.8 })),
    ...products
      .filter((product) => product.active)
      .map((product) => ({ url: canonical(`/product/${product.slug}`), priority: 0.7 })),
  ];
}
