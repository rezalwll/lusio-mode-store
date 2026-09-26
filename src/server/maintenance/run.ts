import "dotenv/config";

import { and, inArray, isNotNull, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../db/schema/index.js";
import { closeDb } from "../../db/client.js";
import { validateRuntimeEnvironment } from "../config/env.js";
import { logServer } from "../observability/logger.js";
import { reconcilePendingPayments } from "../payment/service.js";

const LOCK_ID = 73_012_010;
const DAY_MS = 24 * 60 * 60 * 1_000;

async function runMaintenance() {
  validateRuntimeEnvironment();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  let locked = false;
  try {
    const lockResult = await client.query<{ locked: boolean }>("select pg_try_advisory_lock($1) as locked", [LOCK_ID]);
    locked = Boolean(lockResult.rows[0]?.locked);
    if (!locked) {
      logServer("warn", "maintenance.skipped", "Another maintenance process holds the advisory lock");
      return;
    }

    const reconciliation = await reconcilePendingPayments();
    const db = drizzle(client, { schema });
    const now = new Date();
    const otpRetentionCutoff = new Date(now.getTime() - DAY_MS);
    const stalePaymentCutoff = new Date(now.getTime() - DAY_MS);
    const [adminSessionRows, customerSessionRows, otpRows, rateLimitRows, expiredPaymentRows] = await db.transaction(async (tx) => {
      const deletedAdminSessions = await tx.delete(schema.adminSessions).where(lt(schema.adminSessions.expiresAt, now)).returning({ id: schema.adminSessions.tokenHash });
      const deletedCustomerSessions = await tx.delete(schema.customerSessions).where(lt(schema.customerSessions.expiresAt, now)).returning({ id: schema.customerSessions.tokenHash });
      const deletedOtpChallenges = await tx.delete(schema.customerOtpChallenges).where(or(
        lt(schema.customerOtpChallenges.expiresAt, otpRetentionCutoff),
        and(isNotNull(schema.customerOtpChallenges.consumedAt), lt(schema.customerOtpChallenges.consumedAt, otpRetentionCutoff)),
      )).returning({ id: schema.customerOtpChallenges.id });
      const deletedRateLimitBuckets = await tx.delete(schema.rateLimitBuckets).where(lt(schema.rateLimitBuckets.resetAt, now)).returning({ id: schema.rateLimitBuckets.key });
      const expiredPaymentAttempts = await tx.update(schema.paymentAttempts).set({ status: "expired", failureCode: "maintenance_expired", failureMessage: "Payment attempt expired before verification", updatedAt: now })
        .where(and(inArray(schema.paymentAttempts.status, ["created", "awaiting_user", "verifying"]), lt(schema.paymentAttempts.updatedAt, stalePaymentCutoff)))
        .returning({ id: schema.paymentAttempts.id });
      return [deletedAdminSessions, deletedCustomerSessions, deletedOtpChallenges, deletedRateLimitBuckets, expiredPaymentAttempts] as const;
    });
    logServer("info", "maintenance.completed", "Maintenance completed", {
      adminSessionsDeleted: adminSessionRows.length,
      customerSessionsDeleted: customerSessionRows.length,
      otpChallengesDeleted: otpRows.length,
      rateLimitBucketsDeleted: rateLimitRows.length,
      paymentAttemptsExpired: expiredPaymentRows.length,
      reconciliationExamined: reconciliation.examined,
      reconciliationPaid: reconciliation.paid,
      reconciliationFailed: reconciliation.failed,
      reconciliationSkipped: reconciliation.skipped,
    });
  } finally {
    if (locked) await client.query("select pg_advisory_unlock($1)", [LOCK_ID]);
    client.release();
    await pool.end();
    await closeDb();
  }
}

runMaintenance().catch((error) => {
  logServer("error", "maintenance.failed", "Maintenance failed", {}, error);
  process.exitCode = 1;
});
