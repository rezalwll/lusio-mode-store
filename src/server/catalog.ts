import { initialCategories, initialProducts } from "@/lib/catalog";
import type { Category, Product } from "@/types/store";

// Server-side catalog repository.
//
// Backing store today: the existing static catalog mapping. Server routes,
// metadata, and sitemap must import from here — never from JSON files or
// client state — so a future database swap changes only this module.
// Returned shapes are the shared domain types, identical to the storefront.
export function getProducts(): Product[] {
  return initialProducts;
}

export function getProductBySlug(slug: string): Product | undefined {
  return initialProducts.find((item) => item.slug === slug && item.active);
}

export function getCategories(): Category[] {
  return initialCategories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return initialCategories.find((item) => item.slug === slug && item.active);
}
