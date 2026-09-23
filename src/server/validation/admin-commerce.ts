import { z } from "zod";

export const couponInputSchema = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().min(3).max(40).regex(/^[A-Z0-9_-]+$/i),
  type: z.enum(["percent", "fixed"]),
  value: z.number().int().positive().max(100_000_000_000),
  minOrder: z.number().int().nonnegative().max(100_000_000_000),
  usageLimit: z.number().int().nonnegative().max(10_000_000),
  expiresAt: z.iso.date(),
  active: z.boolean(),
}).superRefine((coupon, context) => {
  if (coupon.type === "percent" && coupon.value > 100) context.addIssue({ code: "custom", path: ["value"], message: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد" });
});

export const orderUpdateSchema = z.object({
  id: z.string().min(8).max(80),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "refunded", "failed"]).optional(),
  trackingCode: z.string().trim().max(160).optional(),
  internalNote: z.string().trim().max(2_000).optional(),
});

