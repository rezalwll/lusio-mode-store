export interface MediaAssetDto {
  id: string;
  objectKey: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  storageDriver: string;
  createdAt: string;
}

async function readError(response: Response) {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error || "عملیات رسانه انجام نشد";
}

export async function uploadMedia(file: File): Promise<MediaAssetDto> {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/admin/media", { method: "POST", body });
  if (!response.ok) throw new Error(await readError(response));
  const result = await response.json() as { asset: MediaAssetDto };
  return result.asset;
}

export async function fetchMedia(): Promise<MediaAssetDto[]> {
  const response = await fetch("/api/admin/media", { cache: "no-store" });
  if (!response.ok) throw new Error(await readError(response));
  const result = await response.json() as { assets: MediaAssetDto[] };
  return result.assets;
}

export async function deleteMedia(id: string) {
  const response = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await readError(response));
}

