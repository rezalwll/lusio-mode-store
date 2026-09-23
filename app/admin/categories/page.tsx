import { AdminCategoriesPage } from "@/views/admin/AdminCategoriesPage";
import { getCategories, getProducts } from "@/server/catalog";

export default async function AdminCategoriesRoutePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return <AdminCategoriesPage categories={categories} products={products} />;
}
