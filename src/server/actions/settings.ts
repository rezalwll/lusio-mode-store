"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { navigationItems, storeSettings } from "@/db/schema";
import type { StoreNavigationItem, StoreSettings } from "@/types/store";
import { requireAdmin } from "@/server/auth/admin-session";
import { assertSameOrigin } from "@/server/security/origin";
import { navigationItemInputSchema, storeSettingsInputSchema } from "@/server/validation/settings";

export async function saveStoreSettingsAction(input: StoreSettings) {
  await assertSameOrigin();
  await requireAdmin(["owner", "admin", "editor"]);
  const parsed = storeSettingsInputSchema.parse(input);
  const data = Object.fromEntries(Object.entries(parsed).filter(([key]) => key !== "navigationItems"));
  await getDb().insert(storeSettings).values({ id: 1, data }).onConflictDoUpdate({ target: storeSettings.id, set: { data, updatedAt: new Date() } });
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

export async function saveNavigationAction(input: StoreNavigationItem[]) {
  await assertSameOrigin();
  await requireAdmin(["owner", "admin", "editor"]);
  const parsed = input.map((item) => navigationItemInputSchema.parse(item));
  await getDb().transaction(async (tx) => {
    await tx.delete(navigationItems);
    if (parsed.length) await tx.insert(navigationItems).values(parsed.map((item, position) => ({ label: item.label, mode: item.mode, target: item.target, fallbackSlug: item.fallbackSlug, active: item.active, position })));
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/navigation");
}
