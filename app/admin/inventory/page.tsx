import { getProducts } from "@/server/catalog";
import { AdminInventoryPage } from "@/views/admin/AdminInventoryPage";

export default async function AdminInventoryRoutePage() {
  return <AdminInventoryPage products={await getProducts()} />;
}
