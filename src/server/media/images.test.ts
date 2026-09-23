// @vitest-environment node

import { File } from "node:buffer";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { processUploadedImage } from "./images";

const originalMaxBytes = process.env.MEDIA_MAX_BYTES;

afterEach(() => {
  if (originalMaxBytes === undefined) delete process.env.MEDIA_MAX_BYTES;
  else process.env.MEDIA_MAX_BYTES = originalMaxBytes;
});

describe("processUploadedImage", () => {
  it("verifies and converts a real image to bounded WebP", async () => {
    const input = await sharp({ create: { width: 64, height: 32, channels: 3, background: "#8f4d59" } }).png().toBuffer();
    const result = await processUploadedImage(new File([input], "sample.png", { type: "image/png" }) as globalThis.File);
    const metadata = await sharp(result.buffer).metadata();
    expect(result.contentType).toBe("image/webp");
    expect(metadata.format).toBe("webp");
    expect([result.width, result.height]).toEqual([64, 32]);
  });

  it("rejects content that only claims to be an image", async () => {
    const file = new File(["not an image"], "fake.png", { type: "image/png" }) as globalThis.File;
    await expect(processUploadedImage(file)).rejects.toThrow();
  });

  it("enforces the configured byte limit before decoding", async () => {
    process.env.MEDIA_MAX_BYTES = "4";
    const file = new File(["12345"], "large.png", { type: "image/png" }) as globalThis.File;
    await expect(processUploadedImage(file)).rejects.toThrow("محدودیت");
  });
});
