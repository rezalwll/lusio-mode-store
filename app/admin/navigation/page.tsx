import { AdminNavigationPage } from "@/views/admin/AdminNavigationPage";
import { getCategories } from "@/server/catalog";
import { getStoreSettings } from "@/server/store-settings";

export default async function AdminNavigationRoutePage() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  return <AdminNavigationPage settings={settings} categories={categories} />;
}
