import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getMediaEnvironment } from "@/server/config/env";

export interface StoredMediaObject {
  objectKey: string;
  publicUrl: string;
  storageDriver: "local" | "s3";
}

interface MediaStorage {
  put(buffer: Buffer, contentType: string): Promise<StoredMediaObject>;
  delete(objectKey: string): Promise<void>;
}

function dateKey(prefix: string) {
  const now = new Date();
  return `${prefix}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;
}

class LocalMediaStorage implements MediaStorage {
  private readonly publicRoot = path.resolve(process.cwd(), "public");

  async put(buffer: Buffer): Promise<StoredMediaObject> {
    const objectKey = dateKey("uploads");
    const absolutePath = path.resolve(this.publicRoot, objectKey);
    if (!absolutePath.startsWith(`${this.publicRoot}${path.sep}`)) throw new Error("Invalid local media path");
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer, { flag: "wx" });
    return { objectKey, publicUrl: `/${objectKey}`, storageDriver: "local" };
  }

  async delete(objectKey: string) {
    const absolutePath = path.resolve(this.publicRoot, objectKey);
    if (!objectKey.startsWith("uploads/") || !absolutePath.startsWith(`${this.publicRoot}${path.sep}`)) throw new Error("Invalid local media path");
    try {
      await unlink(absolutePath);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
}

class S3MediaStorage implements MediaStorage {
  private readonly config = getMediaEnvironment();
  private readonly bucket = this.config.driver === "s3" ? this.config.bucket : "";
  private readonly publicBaseUrl = this.config.driver === "s3" ? this.config.publicBaseUrl : "";
  private readonly client = new S3Client({
    region: this.config.driver === "s3" ? this.config.region : "auto",
    endpoint: this.config.driver === "s3" ? this.config.endpoint : undefined,
    forcePathStyle: this.config.driver === "s3" && this.config.forcePathStyle,
    credentials: {
      accessKeyId: this.config.driver === "s3" ? this.config.accessKeyId : "",
      secretAccessKey: this.config.driver === "s3" ? this.config.secretAccessKey : "",
    },
  });

  async put(buffer: Buffer, contentType: string): Promise<StoredMediaObject> {
    const objectKey = dateKey("media");
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return { objectKey, publicUrl: `${this.publicBaseUrl}/${objectKey}`, storageDriver: "s3" };
  }

  async delete(objectKey: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }
}

let storage: MediaStorage | undefined;

export function getMediaStorage(): MediaStorage {
  if (!storage) storage = getMediaEnvironment().driver === "s3" ? new S3MediaStorage() : new LocalMediaStorage();
  return storage;
}
