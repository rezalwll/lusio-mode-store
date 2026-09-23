import { describe, expect, it } from "vitest";
import { categoryInputSchema, productInputSchema } from "./catalog";

const product = {
  slug: "tshirt-black",
  name: "تیشرت مشکی الون",
  sku: "ELV-1000",
  category: "tshirt",
  price: 1_200_000,
  regularPrice: 1_500_000,
  images: ["/uploads/tshirt.webp"],
  colors: ["مشکی"],
  sizes: ["M"],
  stock: 4,
  featured: false,
  description: "توضیحات کامل محصول برای فروشگاه",
  status: "published" as const,
  variants: [{ sku: "ELV-1000-M-BLK", size: "M", color: "مشکی", stock: 4 }],
};

describe("productInputSchema", () => {
  it("accepts a complete product and local media URL", () => {
    expect(productInputSchema.safeParse(product).success).toBe(true);
  });

  it("rejects inverted prices and duplicate variant combinations", () => {
    const result = productInputSchema.safeParse({
      ...product,
      regularPrice: 1_000_000,
      variants: [...product.variants, { sku: "ELV-1000-M-BLK-2", size: "M", color: "مشکی", stock: 1 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining(["regularPrice", "variants"]));
  });

  it("rejects unsafe image protocols", () => {
    expect(productInputSchema.safeParse({ ...product, images: ["javascript:alert(1)"] }).success).toBe(false);
  });
});

describe("categoryInputSchema", () => {
  it("validates normalized slugs", () => {
    expect(categoryInputSchema.safeParse({ name: "تیشرت", slug: "tshirt", description: "", parent: 0, image: "", active: true }).success).toBe(true);
    expect(categoryInputSchema.safeParse({ name: "تیشرت", slug: "bad slug", description: "", parent: 0, image: "", active: true }).success).toBe(false);
  });
});
