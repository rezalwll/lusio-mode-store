import "server-only";

import sharp from "sharp";

const ALLOWED_INPUT_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);
const ALLOWED_DECLARED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const DEFAULT_MAX_MEDIA_BYTES = 8 * 1024 * 1024;

export interface ProcessedImage {
  buffer: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
}

export async function processUploadedImage(file: File): Promise<ProcessedImage> {
  const maxBytes = Number(process.env.MEDIA_MAX_BYTES || DEFAULT_MAX_MEDIA_BYTES);
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error("MEDIA_MAX_BYTES is invalid");
  if (!ALLOWED_DECLARED_TYPES.has(file.type)) throw new Error("فرمت تصویر باید JPG، PNG، WebP یا AVIF باشد");
  if (file.size <= 0 || file.size > maxBytes) throw new Error("حجم تصویر از محدودیت مجاز بیشتر است");

  const input = Buffer.from(await file.arrayBuffer());
  const pipeline = sharp(input, { failOn: "warning", limitInputPixels: 40_000_000, sequentialRead: true });
  const metadata = await pipeline.metadata();
  if (!metadata.format || !ALLOWED_INPUT_FORMATS.has(metadata.format) || (metadata.pages ?? 1) > 1) {
    throw new Error("محتوای فایل یک تصویر پشتیبانی‌شده نیست");
  }

  const result = await pipeline
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  if (!result.info.width || !result.info.height) throw new Error("ابعاد تصویر قابل تشخیص نیست");
  return { buffer: result.data, contentType: "image/webp", width: result.info.width, height: result.info.height };
}

