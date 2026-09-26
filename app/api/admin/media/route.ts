import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { adminAuditLogs, categories, mediaAssets, productImages, storeSettings } from "@/db/schema";
import { adminAuditValues, createAdminAuditContext } from "@/server/audit/admin-audit";
import { requireAdmin } from "@/server/auth/admin-session";
import { processUploadedImage } from "@/server/media/images";
import { getMediaStorage } from "@/server/media/storage";
import { getMediaAssets } from "@/server/media/queries";
import { assertSameOrigin } from "@/server/security/origin";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { logServer } from "@/server/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin(["owner", "admin", "staff", "editor"]);
  return NextResponse.json({ assets: await getMediaAssets() });
}

export async function POST(request: NextRequest) {
  await assertSameOrigin();
  const user = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(user);
  const limit = await consumeRateLimit(`media-upload:${user.id}`, 40, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "تعداد آپلودها بیش از حد مجاز است" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "فایل تصویر ارسال نشده است" }, { status: 400 });
    const image = await processUploadedImage(file);
    const stored = await getMediaStorage().put(image.buffer, image.contentType);
    try {
      const asset = await getDb().transaction(async (tx) => {
        const [created] = await tx.insert(mediaAssets).values({
          ...stored,
          contentType: image.contentType,
          sizeBytes: image.buffer.byteLength,
          width: image.width,
          height: image.height,
          altText: file.name.replace(/\.[^.]+$/, "").slice(0, 240),
        }).returning();
        await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "media.upload", entityType: "media", entityId: created.id, metadata: { contentType: image.contentType, sizeBytes: image.buffer.byteLength } }));
        return created;
      });
      return NextResponse.json({ asset }, { status: 201 });
    } catch (error) {
      await getMediaStorage().delete(stored.objectKey);
      throw error;
    }
  } catch (error) {
    logServer("error", "media.upload.failed", "Media upload failed", { correlationId: audit.correlationId, actorId: user.id }, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "آپلود تصویر انجام نشد" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  await assertSameOrigin();
  const user = await requireAdmin(["owner", "admin", "editor"]);
  const audit = await createAdminAuditContext(user);
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه رسانه لازم است" }, { status: 400 });

  const [asset] = await getDb().select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!asset) return NextResponse.json({ error: "رسانه پیدا نشد" }, { status: 404 });
  const [productUse, categoryUse, settingsRow] = await Promise.all([
    getDb().select({ id: productImages.id }).from(productImages).where(eq(productImages.url, asset.publicUrl)).limit(1),
    getDb().select({ id: categories.id }).from(categories).where(eq(categories.imageUrl, asset.publicUrl)).limit(1),
    getDb().select({ data: storeSettings.data }).from(storeSettings).where(eq(storeSettings.id, 1)).limit(1),
  ]);
  const containsUrl = (value: unknown): boolean => value === asset.publicUrl || (Array.isArray(value) ? value.some(containsUrl) : Boolean(value && typeof value === "object" && Object.values(value).some(containsUrl)));
  const usedInSettings = containsUrl(settingsRow[0]?.data);
  if (productUse[0] || categoryUse[0] || usedInSettings) {
    return NextResponse.json({ error: "این تصویر در فروشگاه استفاده شده و قابل حذف نیست" }, { status: 409 });
  }

  try {
    await getMediaStorage().delete(asset.objectKey);
    await getDb().transaction(async (tx) => {
      await tx.delete(mediaAssets).where(eq(mediaAssets.id, asset.id));
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, { action: "media.delete", entityType: "media", entityId: asset.id }));
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logServer("error", "media.delete.failed", "Media delete failed", { correlationId: audit.correlationId, actorId: user.id, mediaId: id }, error);
    return NextResponse.json({ error: "حذف رسانه انجام نشد" }, { status: 500 });
  }
}
