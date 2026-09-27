import { defaultStoreSettings } from "@/lib/store-defaults";
import { tomanToRial } from "@/lib/structured-data";
import type { Db } from "../client";
import { coupons, navigationItems, storeSettings } from "../schema";
import { bootstrapAdminOwner, readBootstrapEnvironment } from "./admin-bootstrap";

const defaultCoupons = [
  { code: "ELEVEN10", type: "percent" as const, percentValue: 10, fixedAmountRial: null, minOrder: 1_500_000, usageLimit: 200, expiresAt: new Date("2027-12-20T20:30:00.000Z") },
  { code: "FIRSTBUY", type: "fixed" as const, percentValue: null, fixedAmountRial: 300_000, minOrder: 2_000_000, usageLimit: 500, expiresAt: new Date("2028-01-01T20:30:00.000Z") },
];

export interface CommerceSeedCounts {
  coupons: number;
  navigationItems: number;
}

export async function seedCommerce(db: Db): Promise<CommerceSeedCounts> {
  const navigation = defaultStoreSettings.navigationItems ?? [];
  const settingsData = Object.fromEntries(Object.entries(defaultStoreSettings).filter(([key]) => key !== "navigationItems"));

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

    return { coupons: defaultCoupons.length, navigationItems: navigation.length };
  });
}

export async function seedBootstrapAdmin(db: Db) {
  const input = readBootstrapEnvironment(false);
  if (!input) return 0;
  const result = await bootstrapAdminOwner(db, input);
  return result.outcome === "created" ? 1 : 0;
}
