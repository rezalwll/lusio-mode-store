"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { adminAuditLogs, coupons } from "@/db/schema";
import { adminAuditValues, createAdminAuditContext } from "@/server/audit/admin-audit";
import { tomanToRial } from "@/lib/structured-data";
import { requireAdmin } from "@/server/auth/admin-session";
import { logServer } from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/origin";
import { couponInputSchema } from "@/server/validation/admin-commerce";
import type { Coupon } from "@/types/store";

type Result = { ok: true; id: number } | { ok: false; message: string };

export async function saveCouponAction(input: Omit<Coupon, "used" | "id"> & { id?: number }): Promise<Result> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(actor);
  const parsed = couponInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اطلاعات کد تخفیف معتبر نیست" };
  try {
    const values = {
      code: parsed.data.code.toUpperCase(),
      type: parsed.data.type,
      percentValue: parsed.data.type === "percent" ? parsed.data.value : null,
      fixedAmountRial: parsed.data.type === "fixed" ? BigInt(tomanToRial(parsed.data.value)) : null,
      minOrderRial: BigInt(tomanToRial(parsed.data.minOrder)),
      usageLimit: parsed.data.usageLimit,
      expiresAt: new Date(`${parsed.data.expiresAt}T23:59:59.999Z`),
      active: parsed.data.active,
      updatedAt: new Date(),
    };
    const coupon = await getDb().transaction(async (tx) => {
      const [saved] = parsed.data.id
        ? await tx.update(coupons).set(values).where(eq(coupons.id, parsed.data.id)).returning({ id: coupons.id })
        : await tx.insert(coupons).values(values).returning({ id: coupons.id });
      if (saved) await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: parsed.data.id ? "coupon.update" : "coupon.create", entityType: "coupon", entityId: saved.id }));
      return saved;
    });
    if (!coupon) return { ok: false, message: "کد تخفیف پیدا نشد" };
    revalidatePath("/admin/coupons");
    return { ok: true, id: coupon.id };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "23505") return { ok: false, message: "این کد تخفیف قبلاً ساخته شده است" };
    logServer("error", "coupon.mutation.failed", "Coupon mutation failed", {}, error);
    return { ok: false, message: "ذخیره کد تخفیف انجام نشد" };
  }
}

export async function archiveCouponAction(id: number): Promise<Result> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(actor);
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, message: "کد تخفیف معتبر نیست" };
  const coupon = await getDb().transaction(async (tx) => {
    const [archived] = await tx.update(coupons).set({ active: false, updatedAt: new Date() }).where(eq(coupons.id, id)).returning({ id: coupons.id });
    if (archived) await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "coupon.archive", entityType: "coupon", entityId: id }));
    return archived;
  });
  if (!coupon) return { ok: false, message: "کد تخفیف پیدا نشد" };
  revalidatePath("/admin/coupons");
  return { ok: true, id: coupon.id };
}
