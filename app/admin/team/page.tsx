import { getAdminTeam } from "@/server/admin-team/queries";
import { requireAdmin } from "@/server/auth/admin-session";
import { AdminTeamPage } from "@/views/admin/AdminTeamPage";

export default async function AdminTeamRoutePage() {
  const user = await requireAdmin(["owner", "admin"]);
  return <AdminTeamPage members={await getAdminTeam()} currentUser={user} />;
}
