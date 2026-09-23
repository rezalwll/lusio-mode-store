import { z } from "zod";

const slugSchema = z.string().trim().min(1).max(180).regex(/^[a-z0-9\u0600-\u06ff]+(?:-[a-z0-9\u0600-\u06ff]+)*$/i);
const imageSchema = z.string().trim().min(1).max(2_000).refine(
  (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
  "نشانی تصویر معتبر نیست",
);

export const productVariantInputSchema = z.object({
  id: z.string().max(100).optional(),
  sku: z.string().trim().min(2).max(100),
  size: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(80),
  stock: z.number().int().nonnegative().max(1_000_000),
});

export const productInputSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: slugSchema,
  name: z.string().trim().min(3).max(240),
  sku: z.string().trim().min(2).max(100),
  category: slugSchema,
  price: z.number().int().nonnegative().max(100_000_000_000),
  regularPrice: z.number().int().nonnegative().max(100_000_000_000),
  images: z.array(imageSchema).min(1).max(20),
  colors: z.array(z.string().trim().min(1).max(80)).min(1).max(50),
  sizes: z.array(z.string().trim().min(1).max(80)).min(1).max(50),
  stock: z.number().int().nonnegative().max(1_000_000),
  featured: z.boolean(),
  description: z.string().trim().min(10).max(20_000),
  status: z.enum(["published", "draft", "archived"]),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(170).optional(),
  variants: z.array(productVariantInputSchema).max(500).default([]),
}).superRefine((value, context) => {
  if (value.regularPrice < value.price) {
    context.addIssue({ code: "custom", path: ["regularPrice"], message: "قیمت اصلی نباید کمتر از قیمت فروش باشد" });
  }
  const variantSkus = value.variants.map((variant) => variant.sku.toLowerCase());
  if (new Set(variantSkus).size !== variantSkus.length) {
    context.addIssue({ code: "custom", path: ["variants"], message: "شناسه واریانت‌ها باید یکتا باشد" });
  }
  const combinations = value.variants.map((variant) => `${variant.size.toLowerCase()}\0${variant.color.toLowerCase()}`);
  if (new Set(combinations).size !== combinations.length) {
    context.addIssue({ code: "custom", path: ["variants"], message: "ترکیب رنگ و سایز تکراری است" });
  }
});

export const categoryInputSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  description: z.string().trim().max(4_000),
  parent: z.number().int().nonnegative(),
  image: z.union([imageSchema, z.literal("")]),
  active: z.boolean(),
});

export const bulkProductStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
  status: z.enum(["published", "draft", "archived"]),
});

export type ProductInput = z.input<typeof productInputSchema>;
export type CategoryInput = z.input<typeof categoryInputSchema>;

