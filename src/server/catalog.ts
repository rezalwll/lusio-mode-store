import "server-only";

import { getDb } from "@/db/client";
import type { Category, Product } from "@/types/store";
import { fetchCategories, fetchCategoryBySlug, fetchProductBySlug, fetchProducts } from "./catalog-queries";

// Server catalog boundary. PostgreSQL-backed; DB failures surface as errors
// (never undefined, empty data, or a static fallback).
//
// Reads are intentionally NOT request-memoized: metadata + page rendering a
// product issues two small bounded reads, which keeps every call live
// (stale-cache class of bugs excluded) and the repository honestly testable.
export function getProducts(): Promise<Product[]> {
  return fetchProducts(getDb());
}

export function getProductBySlug(slug: string): Promise<Product | undefined> {
  return fetchProductBySlug(getDb(), slug);
}

export function getCategories(): Promise<Category[]> {
  return fetchCategories(getDb());
}

export function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return fetchCategoryBySlug(getDb(), slug);
}
