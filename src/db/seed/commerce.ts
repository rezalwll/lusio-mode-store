import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { defaultStoreSettings } from "@/lib/store-defaults";
import { tomanToRial } from "@/lib/structured-data";
import type { Db } from "../client";
import { adminUsers, coupons, navigationItems, storeSettings } from "../schema";

const defaultCoupons = [
  { code: "ELEVEN10", type: "percent" as const, percentValue: 10, fixedAmountRial: null, minOrder: 1_500_000, usageLimit: 200, expiresAt: new Date("2027-12-20T20:30:00.000Z") },
  { code: "FIRSTBUY", type: "fixed" as const, percentValue: null, fixedAmountRial: 300_000, minOrder: 2_000_000, usageLimit: 500, expiresAt: new Date("2028-01-01T20:30:00.000Z") },
];

export interface CommerceSeedCounts {
  coupons: number;
  navigationItems: number;
  adminUsers: number;
}

export async function seedCommerce(db: Db): Promise<CommerceSeedCounts> {
  const navigation = defaultStoreSettings.navigationItems ?? [];
  const { navigationItems: _navigationItems, ...settingsData } = defaultStoreSettings;

  return db.transaction(async (tx) => {
    await tx.insert(storeSettings).values({ id: 1, data: settingsData as unknown as Record<string, unknown> }).onConflictDoNothing();

    const existingNavigation = await tx.select({ id: navigationItems.id }).from(navigationItems).limit(1);
    if (!existingNavigation.length) {
      await tx.insert(navigationItems).values(navigation.map((item, position) => ({
        label: item.label,
        mode: item.mode,
        target: item.target,
        fallbackSlug: item.fallbackSlug,
        position,
        active: item.active,
      })));
    }

    for (const coupon of defaultCoupons) {
      await tx.insert(coupons).values({
        code: coupon.code,
        type: coupon.type,
        percentValue: coupon.percentValue,
        fixedAmountRial: coupon.fixedAmountRial === null ? null : BigInt(tomanToRial(coupon.fixedAmountRial)),
        minOrderRial: BigInt(tomanToRial(coupon.minOrder)),
        usageLimit: coupon.usageLimit,
        usedCount: 0,
        active: true,
        expiresAt: coupon.expiresAt,
      }).onConflictDoNothing();
    }

    let adminCount = 0;
    const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    if (email && password) {
      if (password.length < 12) throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters");
      const existing = await tx.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
      if (!existing.length) {
        await tx.insert(adminUsers).values({
          email,
          name: process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "مدیر فروشگاه",
          passwordHash: await hash(password, 12),
          role: "owner",
        });
        adminCount = 1;
      }
    }

    return { coupons: defaultCoupons.length, navigationItems: navigation.length, adminUsers: adminCount };
  });
}
