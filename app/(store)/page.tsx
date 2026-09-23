import { HomePage } from "@/views/store/HomePage";
import { getCategories, getProducts } from "@/server/catalog";
import { getStoreSettings } from "@/server/store-settings";

export default async function StoreHomePage() {
  const [products, categories, settings] = await Promise.all([getProducts(), getCategories(), getStoreSettings()]);
  return <HomePage products={products} categories={categories} settings={settings} />;
}
