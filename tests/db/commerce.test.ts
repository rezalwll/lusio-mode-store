import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "@/db/client";
import { customers, orders, products } from "@/db/schema";
import { initialProducts } from "@/lib/catalog";
import { createOrder } from "@/server/commerce/orders";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for database integration tests");

describe("transactional order creation", () => {
  it("uses DB pricing, decrements stock once, and is idempotent", async () => {
    const db = getDb();
    const source = initialProducts.find((product) => product.stock >= 2);
    if (!source) throw new Error("seeded in-stock product required");
    const [before] = await db.select().from(products).where(eq(products.id, source.id));
    if (!before) throw new Error("seeded product missing");
    const idempotencyKey = randomUUID();
    let orderId = "";
    try {
      const input = {
        idempotencyKey,
        lines: [{ productId: source.id, size: source.sizes[0] || "M", color: source.colors[0] || "مشکی", quantity: 1 }],
        couponCode: "",
        shippingMethod: "تحویل حضوری" as const,
        firstName: "تست", lastName: "تراکنش", phone: "09999999999", email: "",
        province: "تهران", city: "تهران", postalCode: "1234567890", address: "خیابان تست، پلاک آزمایشی", note: "",
      };
      const first = await createOrder(input);
      orderId = first.orderId;
      expect(first.paymentStatus).toBe("pending");
      expect(first.totalRial).toBe(before.priceRial);
      expect((await db.select().from(products).where(eq(products.id, source.id)))[0]?.stock).toBe(before.stock - 1);

      const repeated = await createOrder(input);
      expect(repeated.orderId).toBe(first.orderId);
      expect(repeated.reused).toBe(true);
      expect((await db.select().from(products).where(eq(products.id, source.id)))[0]?.stock).toBe(before.stock - 1);
    } finally {
      if (orderId) await db.delete(orders).where(eq(orders.id, orderId));
      await db.delete(customers).where(eq(customers.phone, "09999999999"));
      await db.update(products).set({ stock: before.stock }).where(eq(products.id, source.id));
    }
  });
});
