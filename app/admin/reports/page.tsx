import { AdminReportsPage } from "@/views/admin/AdminReportsPage";
import { getCustomers, getOrders } from "@/server/commerce/queries";

export default async function AdminReportsRoutePage() {
  const [orders, customers] = await Promise.all([getOrders(), getCustomers()]);
  return <AdminReportsPage orders={orders} customers={customers} nowIso={new Date().toISOString()} />;
}
