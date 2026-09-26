import "server-only";

import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimitBuckets } from "@/db/schema";

export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  if (!Number.isSafeInteger(limit) || limit <= 0 || !Number.isSafeInteger(windowMs) || windowMs < 1_000) throw new Error("Invalid rate-limit configuration");
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);
  const bucketKey = `rl:${createHash("sha256").update(key).digest("hex")}`;
  const [bucket] = await getDb().insert(rateLimitBuckets).values({ key: bucketKey, count: 1, resetAt: nextReset, updatedAt: now })
    .onConflictDoUpdate({
      target: rateLimitBuckets.key,
      set: {
        count: sql`case when ${rateLimitBuckets.resetAt} <= ${now} then 1 else ${rateLimitBuckets.count} + 1 end`,
        resetAt: sql`case when ${rateLimitBuckets.resetAt} <= ${now} then ${nextReset} else ${rateLimitBuckets.resetAt} end`,
        updatedAt: now,
      },
    }).returning({ count: rateLimitBuckets.count, resetAt: rateLimitBuckets.resetAt });
  const allowed = bucket.count <= limit;
  return { allowed, retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1_000)) };
}
