import { z } from "zod";

const faDigits = "۰۱۲۳۴۵۶۷۸۹";
const arDigits = "٠١٢٣٤٥٦٧٨٩";

export function normalizeIranPhone(value: string) {
  const latin = value.trim().replace(/[۰-۹]/g, (digit) => String(faDigits.indexOf(digit))).replace(/[٠-٩]/g, (digit) => String(arDigits.indexOf(digit))).replace(/[\s()-]/g, "");
  if (latin.startsWith("+98")) return `0${latin.slice(3)}`;
  if (latin.startsWith("0098")) return `0${latin.slice(4)}`;
  if (latin.startsWith("98") && latin.length === 12) return `0${latin.slice(2)}`;
  return latin;
}

export const cartLineInputSchema = z.object({
  productId: z.number().int().positive(),
  size: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(20),
});

export const cartQuoteInputSchema = z.object({
  lines: z.array(cartLineInputSchema).min(1).max(50),
  couponCode: z.string().trim().max(80).optional().default(""),
  shippingMethod: z.enum(["پست پیشتاز", "تیپاکس", "تحویل حضوری"]).default("پست پیشتاز"),
}).superRefine((value, context) => {
  const keys = value.lines.map((line) => `${line.productId}\0${line.size}\0${line.color}`);
  if (new Set(keys).size !== keys.length) context.addIssue({ code: "custom", path: ["lines"], message: "اقلام تکراری سبد خرید معتبر نیست" });
});

export const checkoutInputSchema = cartQuoteInputSchema.safeExtend({
  idempotencyKey: z.uuid(),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(120),
  phone: z.string().transform(normalizeIranPhone).pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست")),
  email: z.union([z.literal(""), z.email()]).transform((value) => value.trim().toLowerCase()),
  province: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  address: z.string().trim().min(10).max(1_000),
  note: z.string().trim().max(1_000).optional().default(""),
});

export type CartQuoteInput = z.input<typeof cartQuoteInputSchema>;
export type CheckoutInput = z.output<typeof checkoutInputSchema>;
