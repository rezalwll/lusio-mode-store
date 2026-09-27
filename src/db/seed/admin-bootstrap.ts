import { hash } from "bcryptjs";
import { inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../client";
import { adminUsers } from "../schema";
import { adminPasswordSchema } from "../../server/admin-team/password-policy";

const bootstrapSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: adminPasswordSchema,
  name: z.string().trim().min(2).max(120),
});

export type BootstrapAdminResult = { outcome: "created"; id: string } | { outcome: "already_configured" };

export function readBootstrapEnvironment(required: true): z.infer<typeof bootstrapSchema>;
export function readBootstrapEnvironment(required: false): z.infer<typeof bootstrapSchema> | undefined;
export function readBootstrapEnvironment(required: boolean): z.infer<typeof bootstrapSchema> | undefined {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "مدیر فروشگاه";
  if (!email && !password) {
    if (required) throw new Error("ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required");
    return undefined;
  }
  if (!email || !password) throw new Error("ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD must be provided together");
  return bootstrapSchema.parse({ email, password, name });
}

export async function bootstrapAdminOwner(db: Db, input: z.infer<typeof bootstrapSchema>): Promise<BootstrapAdminResult> {
  const parsed = bootstrapSchema.parse(input);
  const passwordHash = await hash(parsed.password, 12);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(73012011)`);
    const privileged = await tx.select({ id: adminUsers.id }).from(adminUsers).where(inArray(adminUsers.role, ["owner", "admin"])).limit(1);
    if (privileged.length) return { outcome: "already_configured" as const };
    const [created] = await tx.insert(adminUsers).values({ email: parsed.email, name: parsed.name, role: "owner", passwordHash }).returning({ id: adminUsers.id });
    return { outcome: "created" as const, id: created.id };
  });
}
