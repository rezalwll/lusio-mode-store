import { AdminProductsPage } from "@/views/admin/AdminProductsPage";
import { getCategories, getProducts } from "@/server/catalog";

export default async function AdminProductsRoutePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <AdminProductsPage products={products} categories={categories} initialQuery={q.slice(0, 120)} />;
}
