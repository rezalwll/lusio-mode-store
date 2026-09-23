import type { Metadata } from "next";
import { CartPage } from "@/views/store/CartPage";
import { getProducts } from "@/server/catalog";
import { getStoreSettings } from "@/server/store-settings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CartRoutePage() {
  const [products, settings] = await Promise.all([getProducts(), getStoreSettings()]);
  return <CartPage products={products} settings={settings} />;
}
