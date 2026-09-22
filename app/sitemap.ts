import type { MetadataRoute } from "next";
import { canonical } from "@/lib/site";
import { getCategories, getProducts } from "@/server/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: canonical("/"), priority: 1.0 },
    { url: canonical("/shop"), priority: 0.9 },
    ...getCategories()
      .filter((category) => category.active)
      .map((category) => ({ url: canonical(`/category/${category.slug}`), priority: 0.8 })),
    ...getProducts()
      .filter((product) => product.active)
      .map((product) => ({ url: canonical(`/product/${product.slug}`), priority: 0.7 })),
  ];
}
