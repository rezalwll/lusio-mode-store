import "server-only";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { adminAuditLogs } from "@/db/schema";
import type { AdminSessionUser } from "@/server/auth/admin-session";
import { requestSourceFromHeaders } from "@/server/security/request-source";

export interface AdminAuditContext {
  actorAdminId?: string;
  actorEmail: string;
  source: string;
  userAgent: string;
  correlationId: string;
}

export async function createAdminAuditContext(actor: Pick<AdminSessionUser, "id" | "email"> | { id?: string; email: string }): Promise<AdminAuditContext> {
  const requestHeaders = await headers();
  return {
    actorAdminId: actor.id,
    actorEmail: actor.email,
    source: requestSourceFromHeaders(requestHeaders),
    userAgent: (requestHeaders.get("user-agent") || "").slice(0, 500),
    correlationId: randomUUID(),
  };
}

export function adminAuditValues(context: AdminAuditContext, input: { action: string; entityType: string; entityId?: string | number; metadata?: Record<string, unknown> }): typeof adminAuditLogs.$inferInsert {
  return {
    actorAdminId: context.actorAdminId,
    actorEmail: context.actorEmail,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId === undefined ? null : String(input.entityId),
    metadata: input.metadata ?? {},
    source: context.source,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
  };
}
