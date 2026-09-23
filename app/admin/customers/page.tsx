import { AdminCustomersPage } from "@/views/admin/AdminCustomersPage";
import { getCustomers, getOrders } from "@/server/commerce/queries";

export default async function AdminCustomersRoutePage() {
  const [customers, orders] = await Promise.all([getCustomers(), getOrders()]);
  return <AdminCustomersPage customers={customers} orders={orders} />;
}
