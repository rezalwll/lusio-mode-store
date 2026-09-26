"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { adminAuditLogs, adminUsers } from "@/db/schema";
import { adminAuditValues, createAdminAuditContext } from "@/server/audit/admin-audit";
import { assertSameOrigin } from "@/server/security/origin";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { getRequestSource } from "@/server/security/request-source";
import { createAdminSession, destroyAdminSession, getAdminSession } from "./admin-session";

const loginSchema = z.object({
  email: z.email("ایمیل معتبر وارد کنید").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "رمز عبور معتبر نیست").max(200),
  next: z.string().refine((value) => value.startsWith("/admin"), "مسیر بازگشت نامعتبر است").default("/admin"),
});

export interface AdminLoginState { error?: string }

export async function loginAdminAction(_previous: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  await assertSameOrigin();
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password"), next: formData.get("next") || "/admin" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "اطلاعات ورود معتبر نیست" };

  const source = await getRequestSource();
  const limit = await consumeRateLimit(`admin-login:${source}:${parsed.data.email}`, 6, 15 * 60 * 1000);
  if (!limit.allowed) return { error: `تلاش‌های ورود بیش از حد است؛ ${limit.retryAfterSeconds} ثانیه دیگر دوباره امتحان کنید.` };

  const rows = await getDb().select().from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
  const user = rows[0];
  const valid = Boolean(user?.active) && await compare(parsed.data.password, user?.passwordHash || "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!valid || !user) {
    const audit = await createAdminAuditContext({ email: parsed.data.email });
    await getDb().insert(adminAuditLogs).values(adminAuditValues(audit, { action: "auth.login_failed", entityType: "admin_auth" }));
    return { error: "ایمیل یا رمز عبور صحیح نیست." };
  }

  const audit = await createAdminAuditContext(user);
  await createAdminSession(user.id);
  await getDb().transaction(async (tx) => {
    await tx.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
    await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "auth.login_success", entityType: "admin_auth", entityId: user.id }));
  });
  redirect(parsed.data.next);
}

export async function logoutAdminAction() {
  await assertSameOrigin();
  const user = await getAdminSession();
  if (user) {
    const audit = await createAdminAuditContext(user);
    await getDb().insert(adminAuditLogs).values(adminAuditValues(audit, { action: "auth.logout", entityType: "admin_auth", entityId: user.id }));
  }
  await destroyAdminSession();
  redirect("/login");
}
