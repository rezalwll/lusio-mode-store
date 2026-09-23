import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { adminSessions, adminUsers } from "@/db/schema";

const COOKIE_NAME = "eleven_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type AdminRole = "owner" | "admin" | "staff" | "editor";
export interface AdminSessionUser { id: string; email: string; name: string; role: AdminRole }

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function asRole(role: string): AdminRole {
  if (["owner", "admin", "staff", "editor"].includes(role)) return role as AdminRole;
  throw new Error("Invalid admin role in database");
}

export async function createAdminSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await getDb().insert(adminSessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const rows = await getDb()
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.tokenHash, hashToken(token)), gt(adminSessions.expiresAt, new Date()), eq(adminUsers.active, true)))
    .limit(1);
  const user = rows[0];
  return user ? { ...user, role: asRole(user.role) } : null;
}

export async function requireAdmin(roles?: AdminRole[]) {
  const user = await getAdminSession();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/admin?forbidden=1");
  return user;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await getDb().delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  cookieStore.delete(COOKIE_NAME);
}
