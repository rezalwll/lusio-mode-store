import "server-only";

import { desc, gt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { adminSessions, adminUsers } from "@/db/schema";
import type { AdminRole } from "@/server/auth/admin-session";

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  activeSessions: number;
  lastLoginAt?: string;
  createdAt: string;
}

export async function getAdminTeam(): Promise<AdminTeamMember[]> {
  const db = getDb();
  const [users, sessions] = await Promise.all([
    db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt)),
    db.select({ userId: adminSessions.userId }).from(adminSessions).where(gt(adminSessions.expiresAt, new Date())),
  ]);
  const counts = new Map<string, number>();
  for (const session of sessions) counts.set(session.userId, (counts.get(session.userId) ?? 0) + 1);
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AdminRole,
    active: user.active,
    activeSessions: counts.get(user.id) ?? 0,
    lastLoginAt: user.lastLoginAt?.toISOString(),
    createdAt: user.createdAt.toISOString(),
  }));
}
