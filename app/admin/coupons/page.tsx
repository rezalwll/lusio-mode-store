import { AdminCouponsPage } from "@/views/admin/AdminCouponsPage";
import { getCoupons } from "@/server/commerce/queries";

export default async function AdminCouponsRoutePage() {
  return <AdminCouponsPage coupons={await getCoupons()} />;
}
