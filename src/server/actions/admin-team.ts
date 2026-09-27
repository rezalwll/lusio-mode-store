"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditContext } from "@/server/audit/admin-audit";
import { requireAdmin } from "@/server/auth/admin-session";
import { adminMemberIdSchema, AdminTeamError, createAdminMember, createAdminMemberSchema, resetAdminMemberPassword, resetAdminPasswordSchema, revokeAdminMemberSessions, updateAdminMember, updateAdminMemberSchema } from "@/server/admin-team/service";
import { logServer } from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/origin";

type Result = { ok: true; id?: string; revoked?: number } | { ok: false; message: string };

async function context() {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin"]);
  return { actor, audit: await createAdminAuditContext(actor) };
}

function failure(error: unknown, event: string): Result {
  if (error instanceof AdminTeamError) return { ok: false, message: error.publicMessage };
  logServer("error", event, "Admin team operation failed", {}, error);
  return { ok: false, message: "عملیات مدیریت تیم انجام نشد" };
}

export async function createAdminMemberAction(input: unknown): Promise<Result> {
  const { actor, audit } = await context();
  const parsed = createAdminMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اطلاعات مدیر معتبر نیست" };
  try {
    const id = await createAdminMember(parsed.data, actor, audit);
    revalidatePath("/admin/team");
    return { ok: true, id };
  } catch (error) { return failure(error, "admin_team.create.failed"); }
}

export async function updateAdminMemberAction(input: unknown): Promise<Result> {
  const { actor, audit } = await context();
  const parsed = updateAdminMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اطلاعات مدیر معتبر نیست" };
  try {
    const id = await updateAdminMember(parsed.data, actor, audit);
    revalidatePath("/admin/team");
    return { ok: true, id };
  } catch (error) { return failure(error, "admin_team.update.failed"); }
}

export async function resetAdminMemberPasswordAction(input: unknown): Promise<Result> {
  const { actor, audit } = await context();
  const parsed = resetAdminPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "رمز عبور معتبر نیست" };
  try {
    const revoked = await resetAdminMemberPassword(parsed.data, actor, audit);
    revalidatePath("/admin/team");
    return { ok: true, revoked };
  } catch (error) { return failure(error, "admin_team.password_reset.failed"); }
}

export async function revokeAdminMemberSessionsAction(input: unknown): Promise<Result> {
  const { actor, audit } = await context();
  const parsed = adminMemberIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "شناسه مدیر معتبر نیست" };
  try {
    const revoked = await revokeAdminMemberSessions(parsed.data.id, actor, audit);
    revalidatePath("/admin/team");
    return { ok: true, revoked };
  } catch (error) { return failure(error, "admin_team.sessions_revoke.failed"); }
}
