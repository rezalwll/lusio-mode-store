import "server-only";

import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { navigationItems, storeSettings } from "@/db/schema";
import type { StoreNavigationItem, StoreSettings } from "@/types/store";
import { storeSettingsInputSchema } from "./validation/settings";

export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await getDb().select({ data: storeSettings.data }).from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  if (!rows[0]) throw new Error("Store settings are not seeded. Run npm run db:setup.");
  const settings = storeSettingsInputSchema.parse(rows[0].data);
  const navigation = await getDb().select().from(navigationItems).orderBy(asc(navigationItems.position));
  return { ...settings, navigationItems: navigation.map((item): StoreNavigationItem => ({ id: item.id, label: item.label, mode: item.mode as StoreNavigationItem["mode"], target: item.target, fallbackSlug: item.fallbackSlug, active: item.active })) };
}
