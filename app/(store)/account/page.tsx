import type { Metadata } from "next";
import { AccountPage } from "@/views/store/AccountPage";
import { getCustomerSession } from "@/server/auth/customer-session";
import { getOrders } from "@/server/commerce/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountRoutePage() {
  const customer = await getCustomerSession();
  const orders = customer ? await getOrders(customer.id) : [];
  return <AccountPage customer={customer} orders={orders} />;
}
