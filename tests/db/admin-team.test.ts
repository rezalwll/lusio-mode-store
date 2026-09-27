import "dotenv/config";

import { randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "@/db/client";
import { bootstrapAdminOwner } from "@/db/seed/admin-bootstrap";
import { adminAuditLogs, adminSessions, adminUsers } from "@/db/schema";
import type { AdminAuditContext } from "@/server/audit/admin-audit";
import type { AdminSessionUser } from "@/server/auth/admin-session";
import {
  AdminTeamError,
  createAdminMember,
  resetAdminMemberPassword,
  revokeAdminMemberSessions,
  updateAdminMember,
} from "@/server/admin-team/service";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for database integration tests");

describe("admin team production safeguards", () => {
  it("covers role, password, session, last-owner, and bootstrap safety", async () => {
    const db = getDb();
    let [owner] = await db.select().from(adminUsers).where(eq(adminUsers.role, "owner")).limit(1);
    const createdOwner = !owner;
    if (!owner) {
      [owner] = await db.insert(adminUsers).values({
        email: `owner-${randomUUID()}@example.test`,
        name: "مالک تست",
        passwordHash: await hash("Reliable-Owner-Password-1", 12),
        role: "owner",
      }).returning();
    }

    const actor: AdminSessionUser = { id: owner.id, email: owner.email, name: owner.name, role: "owner" };
    const audit: AdminAuditContext = {
      actorAdminId: owner.id,
      actorEmail: owner.email,
      source: "admin-team-db-test",
      userAgent: "vitest",
      correlationId: randomUUID(),
    };
    const memberEmail = `admin-team-${randomUUID()}@example.test`;
    const firstPassword = "Reliable-Team-Password-1";
    const resetPassword = "Reliable-Team-Password-2";
    let memberId = "";

    try {
      memberId = await createAdminMember({ name: "مدیر تست", email: memberEmail, role: "admin", password: firstPassword }, actor, audit);
      const [created] = await db.select().from(adminUsers).where(eq(adminUsers.id, memberId));
      expect(created?.role).toBe("admin");
      expect(await compare(firstPassword, created!.passwordHash)).toBe(true);

      await db.insert(adminSessions).values({ tokenHash: randomUUID(), userId: memberId, expiresAt: new Date(Date.now() + 60_000) });
      await updateAdminMember({ id: memberId, name: created!.name, email: memberEmail, role: "staff", active: true }, actor, audit);
      expect((await db.select().from(adminSessions).where(eq(adminSessions.userId, memberId)))).toHaveLength(0);

      await db.insert(adminSessions).values({ tokenHash: randomUUID(), userId: memberId, expiresAt: new Date(Date.now() + 60_000) });
      expect(await resetAdminMemberPassword({ id: memberId, password: resetPassword }, actor, audit)).toBe(1);
      const [afterReset] = await db.select().from(adminUsers).where(eq(adminUsers.id, memberId));
      expect(await compare(resetPassword, afterReset!.passwordHash)).toBe(true);
      expect(await compare(firstPassword, afterReset!.passwordHash)).toBe(false);

      await db.insert(adminSessions).values({ tokenHash: randomUUID(), userId: memberId, expiresAt: new Date(Date.now() + 60_000) });
      expect(await revokeAdminMemberSessions(memberId, actor, audit)).toBe(1);

      await db.insert(adminSessions).values({ tokenHash: randomUUID(), userId: memberId, expiresAt: new Date(Date.now() + 60_000) });
      await updateAdminMember({ id: memberId, name: afterReset!.name, email: memberEmail, role: "staff", active: false }, actor, audit);
      expect((await db.select().from(adminSessions).where(eq(adminSessions.userId, memberId)))).toHaveLength(0);
      expect((await db.select().from(adminUsers).where(eq(adminUsers.id, memberId)))[0]?.active).toBe(false);

      const syntheticOwner: AdminSessionUser = { id: randomUUID(), email: "safety-check@example.test", name: "Safety check", role: "owner" };
      await expect(updateAdminMember({ id: owner.id, name: owner.name, email: owner.email, role: "admin", active: true }, syntheticOwner, audit))
        .rejects.toEqual(expect.objectContaining<Partial<AdminTeamError>>({ publicMessage: "آخرین مالک فعال را نمی‌توان غیرفعال یا تنزل نقش داد" }));

      const originalOwnerHash = owner.passwordHash;
      await expect(bootstrapAdminOwner(db, { email: `replacement-${randomUUID()}@example.test`, name: "مالک جایگزین", password: "Replacement-Owner-Password-1" }))
        .resolves.toEqual({ outcome: "already_configured" });
      expect((await db.select().from(adminUsers).where(eq(adminUsers.id, owner.id)))[0]?.passwordHash).toBe(originalOwnerHash);

      const actions = (await db.select({ action: adminAuditLogs.action }).from(adminAuditLogs).where(and(eq(adminAuditLogs.entityType, "admin_user"), eq(adminAuditLogs.entityId, memberId)))).map((row) => row.action);
      expect(actions).toEqual(expect.arrayContaining([
        "admin_user.created",
        "admin_user.role_changed",
        "admin_user.deactivated",
        "admin_user.password_reset",
        "admin_user.sessions_revoked",
      ]));
    } finally {
      if (memberId) {
        await db.delete(adminAuditLogs).where(and(eq(adminAuditLogs.entityType, "admin_user"), eq(adminAuditLogs.entityId, memberId)));
        await db.delete(adminUsers).where(eq(adminUsers.id, memberId));
      }
      if (createdOwner) await db.delete(adminUsers).where(eq(adminUsers.id, owner.id));
    }
  });
});
