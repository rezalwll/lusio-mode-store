import { AdminSettingsPage } from "@/views/admin/AdminSettingsPage";
import { getStoreSettings } from "@/server/store-settings";

export default async function AdminSettingsRoutePage() {
  return <AdminSettingsPage settings={await getStoreSettings()} />;
}
