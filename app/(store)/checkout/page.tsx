import type { Metadata } from "next";
import { CheckoutPage } from "@/views/store/CheckoutPage";
import { getProducts } from "@/server/catalog";
import { getStoreSettings } from "@/server/store-settings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutRoutePage() {
  const [products, settings] = await Promise.all([getProducts(), getStoreSettings()]);
  return <CheckoutPage products={products} settings={settings} />;
}
