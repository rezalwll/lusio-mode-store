export const MAX_IMAGE_FILE_SIZE = 8 * 1024 * 1024;

export async function compressImageFile(file: File, maxDimension = 1600) {
  if (!file.type.startsWith("image/")) throw new Error("فقط فایل تصویری مجاز است");
  if (file.size > MAX_IMAGE_FILE_SIZE) throw new Error("حجم هر تصویر باید کمتر از ۸ مگابایت باشد");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.82);
}
