import { describe, expect, it } from "vitest";
import { cartQuoteInputSchema, checkoutInputSchema, normalizeIranPhone } from "./checkout";

const line = { productId: 1, size: "M", color: "مشکی", quantity: 1 };

describe("normalizeIranPhone", () => {
  it("normalizes Persian digits and Iranian country codes", () => {
    expect(normalizeIranPhone("۰۹۱۲ ۳۴۵ ۶۷۸۹")).toBe("09123456789");
    expect(normalizeIranPhone("+989123456789")).toBe("09123456789");
  });
});

describe("checkout validation", () => {
  it("rejects duplicate lines and oversized quantities", () => {
    expect(cartQuoteInputSchema.safeParse({ lines: [line, line], shippingMethod: "پست پیشتاز" }).success).toBe(false);
    expect(cartQuoteInputSchema.safeParse({ lines: [{ ...line, quantity: 21 }], shippingMethod: "پست پیشتاز" }).success).toBe(false);
  });

  it("normalizes phone in a complete checkout payload", () => {
    const result = checkoutInputSchema.safeParse({
      lines: [line], couponCode: "", shippingMethod: "پست پیشتاز", idempotencyKey: crypto.randomUUID(),
      firstName: "علی", lastName: "محمدی", phone: "+989123456789", email: "", province: "تهران", city: "تهران",
      postalCode: "1234567890", address: "خیابان نمونه، پلاک ده", note: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("09123456789");
  });
});

