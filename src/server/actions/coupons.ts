"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { coupons } from "@/db/schema";
import { tomanToRial } from "@/lib/structured-data";
import { requireAdmin } from "@/server/auth/admin-session";
import { assertSameOrigin } from "@/server/security/origin";
import { couponInputSchema } from "@/server/validation/admin-commerce";
import type { Coupon } from "@/types/store";

type Result = { ok: true; id: number } | { ok: false; message: string };

export async function saveCouponAction(input: Omit<Coupon, "used" | "id"> & { id?: number }): Promise<Result> {
  await assertSameOrigin();
  await requireAdmin(["owner", "admin", "editor"]);
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
    const [coupon] = parsed.data.id
      ? await getDb().update(coupons).set(values).where(eq(coupons.id, parsed.data.id)).returning({ id: coupons.id })
      : await getDb().insert(coupons).values(values).returning({ id: coupons.id });
    if (!coupon) return { ok: false, message: "کد تخفیف پیدا نشد" };
    revalidatePath("/admin/coupons");
    return { ok: true, id: coupon.id };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "23505") return { ok: false, message: "این کد تخفیف قبلاً ساخته شده است" };
    console.error("coupon mutation failed", error);
    return { ok: false, message: "ذخیره کد تخفیف انجام نشد" };
  }
}

export async function archiveCouponAction(id: number): Promise<Result> {
  await assertSameOrigin();
  await requireAdmin(["owner", "admin", "editor"]);
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, message: "کد تخفیف معتبر نیست" };
  const [coupon] = await getDb().update(coupons).set({ active: false, updatedAt: new Date() }).where(eq(coupons.id, id)).returning({ id: coupons.id });
  if (!coupon) return { ok: false, message: "کد تخفیف پیدا نشد" };
  revalidatePath("/admin/coupons");
  return { ok: true, id: coupon.id };
}
