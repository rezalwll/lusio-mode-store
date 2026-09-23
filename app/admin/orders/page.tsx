import { AdminOrdersPage } from "@/views/admin/AdminOrdersPage";
import { getOrders } from "@/server/commerce/queries";

export default async function AdminOrdersRoutePage() {
  return <AdminOrdersPage orders={await getOrders()} />;
}
