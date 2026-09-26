import "server-only";

import { desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { adminAuditLogs } from "@/db/schema";

export async function getRecentAdminActivity() {
  return getDb().select({
    id: adminAuditLogs.id,
    actorEmail: adminAuditLogs.actorEmail,
    action: adminAuditLogs.action,
    entityType: adminAuditLogs.entityType,
    entityId: adminAuditLogs.entityId,
    metadata: adminAuditLogs.metadata,
    source: adminAuditLogs.source,
    correlationId: adminAuditLogs.correlationId,
    createdAt: adminAuditLogs.createdAt,
  }).from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(200);
}
