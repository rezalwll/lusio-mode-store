import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { validateRuntimeEnvironment } from "@/server/config/env";
import { createCorrelationId } from "@/server/observability/correlation";
import { logServer } from "@/server/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const correlationId = createCorrelationId();
  try {
    validateRuntimeEnvironment();
    await Promise.race([
      getDb().execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database readiness check timed out")), 2_000)),
    ]);
    return NextResponse.json({ status: "ready" }, { headers: { "cache-control": "no-store", "x-correlation-id": correlationId } });
  } catch (error) {
    logServer("error", "health.readiness.failed", "Application is not ready", { correlationId }, error);
    return NextResponse.json({ status: "not_ready", correlationId }, { status: 503, headers: { "cache-control": "no-store", "x-correlation-id": correlationId } });
  }
}
