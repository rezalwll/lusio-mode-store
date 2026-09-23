import "server-only";

import { desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import type { MediaAssetDto } from "@/lib/media-client";

export async function getMediaAssets(): Promise<MediaAssetDto[]> {
  const rows = await getDb().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(200);
  return rows.map((asset) => ({ ...asset, createdAt: asset.createdAt.toISOString() }));
}

