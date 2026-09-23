import { AdminAppearancePage } from "@/views/admin/AdminAppearancePage";
import { getStoreSettings } from "@/server/store-settings";

export default async function AdminAppearanceRoutePage() {
  return <AdminAppearancePage settings={await getStoreSettings()} />;
}
