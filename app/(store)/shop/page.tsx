import { ShopPage } from "@/views/store/ShopPage";
import { getCategories, getProducts } from "@/server/catalog";

export default async function ShopRoutePage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const [search, products, categories] = await Promise.all([searchParams, getProducts(), getCategories()]);
  return <ShopPage products={products} categories={categories} initialQuery={search.q ?? ""} initialCategory={search.category ?? ""} initialSort={search.sort ?? "newest"} />;
}
