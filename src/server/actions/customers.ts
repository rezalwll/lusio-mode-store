"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { adminAuditLogs, customers, customerSessions } from "@/db/schema";
import { adminAuditValues, createAdminAuditContext } from "@/server/audit/admin-audit";
import { requireAdmin } from "@/server/auth/admin-session";
import { assertSameOrigin } from "@/server/security/origin";
import { normalizeIranPhone } from "@/server/validation/checkout";

const inputSchema = z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(220), phone: z.string().transform(normalizeIranPhone).pipe(z.string().regex(/^09\d{9}$/)), email: z.union([z.literal(""), z.email()]).transform((value) => value.trim().toLowerCase()), city: z.string().trim().max(120), active: z.boolean() });
type Result = { ok: true } | { ok: false; message: string };

export async function saveCustomerAction(input: unknown): Promise<Result> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "staff"]);
  const audit = await createAdminAuditContext(actor);
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اطلاعات مشتری معتبر نیست" };
  try {
    await getDb().transaction(async (tx) => {
      const [current] = await tx.select().from(customers).where(eq(customers.id, parsed.data.id)).for("update").limit(1);
      if (!current) throw new Error("NOT_FOUND");
      await tx.update(customers).set({ name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email || null, city: parsed.data.city, active: parsed.data.active, updatedAt: new Date() }).where(eq(customers.id, current.id));
      if (!parsed.data.active) await tx.delete(customerSessions).where(eq(customerSessions.customerId, current.id));
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "customer.update", entityType: "customer", entityId: current.id, metadata: { activeBefore: current.active, activeAfter: parsed.data.active } }));
    });
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return { ok: false, message: "مشتری پیدا نشد" };
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "23505") return { ok: false, message: "شماره موبایل یا ایمیل قبلاً ثبت شده است" };
    console.error("customer update failed", error);
    return { ok: false, message: "ذخیره مشتری انجام نشد" };
  }
}
