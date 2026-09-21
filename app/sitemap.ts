import type { MetadataRoute } from "next";
import { initialCategories, initialProducts } from "@/lib/catalog";
import { canonical } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: canonical("/"), priority: 1.0 },
    { url: canonical("/shop"), priority: 0.9 },
    ...initialCategories
      .filter((category) => category.active)
      .map((category) => ({ url: canonical(`/category/${category.slug}`), priority: 0.8 })),
    ...initialProducts
      .filter((product) => product.active)
      .map((product) => ({ url: canonical(`/product/${product.slug}`), priority: 0.7 })),
  ];
}
