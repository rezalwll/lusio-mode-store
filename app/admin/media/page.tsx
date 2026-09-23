import { getMediaAssets } from "@/server/media/queries";
import { AdminMediaPage } from "@/views/admin/AdminMediaPage";

export default async function AdminMediaRoutePage() {
  return <AdminMediaPage initialAssets={await getMediaAssets()} />;
}

