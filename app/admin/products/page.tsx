import { AdminProductsPage } from "@/views/admin/AdminProductsPage";
import { getCategories, getProducts } from "@/server/catalog";

export default async function AdminProductsRoutePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <AdminProductsPage products={products} categories={categories} />;
}
