import "server-only";

import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { adminAuditLogs, adminSessions, adminUsers } from "@/db/schema";
import { adminAuditValues, type AdminAuditContext } from "@/server/audit/admin-audit";
import type { AdminRole, AdminSessionUser } from "@/server/auth/admin-session";

const roles = ["owner", "admin", "staff", "editor"] as const;
const weakPasswords = new Set(["password", "password123", "123456789012", "qwerty123456", "admin123456", "changeme1234", "change-me-before-production"]);

export const adminPasswordSchema = z.string().min(12, "رمز عبور باید حداقل ۱۲ کاراکتر باشد").max(128, "رمز عبور بیش از حد طولانی است").refine((value) => {
  const normalized = value.trim().toLowerCase();
  return !weakPasswords.has(normalized) && new Set(normalized).size >= 5;
}, "رمز عبور انتخاب‌شده بسیار ضعیف یا آزمایشی است");

export const createAdminMemberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: z.enum(roles),
  password: adminPasswordSchema,
});

export const updateAdminMemberSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: z.enum(roles),
  active: z.boolean(),
});

export const resetAdminPasswordSchema = z.object({ id: z.uuid(), password: adminPasswordSchema });
export const adminMemberIdSchema = z.object({ id: z.uuid() });

export class AdminTeamError extends Error {
  constructor(public readonly publicMessage: string) { super(publicMessage); }
}

function actorCanManage(actor: AdminSessionUser, target: { id: string; role: string }, nextRole?: AdminRole) {
  if (actor.role === "owner") return;
  if (actor.role !== "admin" || target.role === "owner" || target.role === "admin" || nextRole === "owner" || nextRole === "admin") {
    throw new AdminTeamError("فقط مالک فروشگاه می‌تواند این سطح دسترسی را مدیریت کند");
  }
}

export async function createAdminMember(input: z.infer<typeof createAdminMemberSchema>, actor: AdminSessionUser, audit: AdminAuditContext) {
  if (actor.role !== "owner" && input.role !== "staff" && input.role !== "editor") throw new AdminTeamError("مدیر فقط می‌تواند کارمند یا ویرایشگر بسازد");
  const passwordHash = await hash(input.password, 12);
  try {
    return await getDb().transaction(async (tx) => {
      const [created] = await tx.insert(adminUsers).values({ name: input.name, email: input.email, role: input.role, passwordHash }).returning({ id: adminUsers.id });
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "admin_user.created", entityType: "admin_user", entityId: created.id, metadata: { role: input.role } }));
      return created.id;
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && String(error.code) === "23505") throw new AdminTeamError("این ایمیل قبلاً برای مدیر دیگری ثبت شده است");
    throw error;
  }
}

export async function updateAdminMember(input: z.infer<typeof updateAdminMemberSchema>, actor: AdminSessionUser, audit: AdminAuditContext) {
  try {
    return await getDb().transaction(async (tx) => {
      const [target] = await tx.select().from(adminUsers).where(eq(adminUsers.id, input.id)).for("update").limit(1);
      if (!target) throw new AdminTeamError("کاربر مدیریتی پیدا نشد");
      actorCanManage(actor, target, input.role);
      if (target.id === actor.id && (input.role !== target.role || !input.active)) throw new AdminTeamError("نقش یا وضعیت حساب فعلی را نمی‌توانید از همین صفحه تغییر دهید");
      if (target.role === "owner" && target.active && (input.role !== "owner" || !input.active)) {
        const activeOwners = await tx.select({ id: adminUsers.id }).from(adminUsers).where(and(eq(adminUsers.role, "owner"), eq(adminUsers.active, true))).for("update");
        if (activeOwners.length <= 1) throw new AdminTeamError("آخرین مالک فعال را نمی‌توان غیرفعال یا تنزل نقش داد");
      }
      await tx.update(adminUsers).set({ name: input.name, email: input.email, role: input.role, active: input.active, updatedAt: new Date() }).where(eq(adminUsers.id, target.id));
      const roleChanged = target.role !== input.role;
      const activeChanged = target.active !== input.active;
      if (roleChanged || !input.active) await tx.delete(adminSessions).where(eq(adminSessions.userId, target.id));
      const events = [];
      if (roleChanged) events.push(adminAuditValues(audit, { action: "admin_user.role_changed", entityType: "admin_user", entityId: target.id, metadata: { from: target.role, to: input.role } }));
      if (activeChanged) events.push(adminAuditValues(audit, { action: input.active ? "admin_user.activated" : "admin_user.deactivated", entityType: "admin_user", entityId: target.id }));
      if (!roleChanged && !activeChanged && (target.name !== input.name || target.email !== input.email)) events.push(adminAuditValues(audit, { action: "admin_user.profile_updated", entityType: "admin_user", entityId: target.id }));
      if (roleChanged || !input.active) events.push(adminAuditValues(audit, { action: "admin_user.sessions_revoked", entityType: "admin_user", entityId: target.id, metadata: { reason: roleChanged ? "role_changed" : "deactivated" } }));
      if (events.length) await tx.insert(adminAuditLogs).values(events);
      return target.id;
    });
  } catch (error) {
    if (error instanceof AdminTeamError) throw error;
    if (typeof error === "object" && error && "code" in error && String(error.code) === "23505") throw new AdminTeamError("این ایمیل قبلاً برای مدیر دیگری ثبت شده است");
    throw error;
  }
}

export async function resetAdminMemberPassword(input: z.infer<typeof resetAdminPasswordSchema>, actor: AdminSessionUser, audit: AdminAuditContext) {
  if (input.id === actor.id) throw new AdminTeamError("برای جلوگیری از قطع ناخواسته دسترسی، رمز حساب فعلی را از این بخش بازنشانی نکنید");
  const passwordHash = await hash(input.password, 12);
  return getDb().transaction(async (tx) => {
    const [target] = await tx.select().from(adminUsers).where(eq(adminUsers.id, input.id)).for("update").limit(1);
    if (!target) throw new AdminTeamError("کاربر مدیریتی پیدا نشد");
    actorCanManage(actor, target);
    await tx.update(adminUsers).set({ passwordHash, updatedAt: new Date() }).where(eq(adminUsers.id, target.id));
    const revoked = await tx.delete(adminSessions).where(eq(adminSessions.userId, target.id)).returning({ id: adminSessions.tokenHash });
    await tx.insert(adminAuditLogs).values([
      adminAuditValues(audit, { action: "admin_user.password_reset", entityType: "admin_user", entityId: target.id }),
      adminAuditValues(audit, { action: "admin_user.sessions_revoked", entityType: "admin_user", entityId: target.id, metadata: { reason: "password_reset", count: revoked.length } }),
    ]);
    return revoked.length;
  });
}

export async function revokeAdminMemberSessions(id: string, actor: AdminSessionUser, audit: AdminAuditContext) {
  if (id === actor.id) throw new AdminTeamError("نشست حساب فعلی را از این صفحه لغو نکنید");
  return getDb().transaction(async (tx) => {
    const [target] = await tx.select().from(adminUsers).where(eq(adminUsers.id, id)).for("update").limit(1);
    if (!target) throw new AdminTeamError("کاربر مدیریتی پیدا نشد");
    actorCanManage(actor, target);
    const revoked = await tx.delete(adminSessions).where(eq(adminSessions.userId, target.id)).returning({ id: adminSessions.tokenHash });
    await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "admin_user.sessions_revoked", entityType: "admin_user", entityId: target.id, metadata: { reason: "manual", count: revoked.length } }));
    return revoked.length;
  });
}
