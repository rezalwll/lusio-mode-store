import { AdminDashboardPage } from "@/views/admin/AdminDashboardPage";
import { getProducts } from "@/server/catalog";
import { getCustomers, getOrders } from "@/server/commerce/queries";
import { getStoreSettings } from "@/server/store-settings";

export default async function AdminIndexPage() {
  const [products, orders, customers, settings] = await Promise.all([getProducts(), getOrders(), getCustomers(), getStoreSettings()]);
  return <AdminDashboardPage products={products} orders={orders} customers={customers} settings={settings} nowIso={new Date().toISOString()} />;
}
