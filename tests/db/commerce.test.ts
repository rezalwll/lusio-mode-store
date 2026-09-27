import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "@/db/client";
import { couponRedemptions, coupons, customers, orderItems, orders, paymentAttempts, products, productVariants } from "@/db/schema";
import { initialProducts } from "@/lib/catalog";
import { createOrder } from "@/server/commerce/orders";
import { expireUnpaidOrderReservations, releaseUnpaidOrder } from "@/server/commerce/reservations";
import { applyPaymentVerification } from "@/server/payment/service";

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

describe("unpaid reservation lifecycle", () => {
  it("reserves and releases product/coupon once, then flags a late captured payment", async () => {
    const db = getDb();
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, "ELEVEN10")).limit(1);
    const source = initialProducts.find((product) => product.stock >= 2 && product.price >= 1_500_000);
    if (!source || !coupon) throw new Error("seeded product and coupon required");
    const [beforeProduct] = await db.select().from(products).where(eq(products.id, source.id));
    if (!beforeProduct) throw new Error("seeded product missing");
    const phone = "09999999998";
    let orderId = "";
    try {
      const created = await createOrder({
        idempotencyKey: randomUUID(),
        lines: [{ productId: source.id, size: source.sizes[0] || "M", color: source.colors[0] || "مشکی", quantity: 1 }],
        couponCode: coupon.code,
        shippingMethod: "تحویل حضوری",
        firstName: "تست", lastName: "رزرو", phone, email: "",
        province: "تهران", city: "تهران", postalCode: "1234567890", address: "خیابان تست، پلاک رزرو", note: "",
      });
      orderId = created.orderId;
      const [reservedOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
      const [reservedCoupon] = await db.select().from(coupons).where(eq(coupons.id, coupon.id));
      const [redemption] = await db.select().from(couponRedemptions).where(eq(couponRedemptions.orderId, orderId));
      expect(reservedOrder?.reservationExpiresAt.getTime()).toBeGreaterThan(reservedOrder?.createdAt.getTime() ?? Infinity);
      expect((await db.select().from(products).where(eq(products.id, source.id)))[0]?.stock).toBe(beforeProduct.stock - 1);
      expect(reservedCoupon?.usedCount).toBe(coupon.usedCount + 1);
      expect(redemption?.status).toBe("reserved");

      const [attempt] = await db.insert(paymentAttempts).values({ orderId, providerKey: "test", amountRial: reservedOrder!.totalRial, idempotencyKey: randomUUID(), callbackTokenHash: randomUUID().replaceAll("-", "") }).returning();
      expect((await releaseUnpaidOrder({ orderId, reason: "admin_cancelled" })).outcome).toBe("released");
      expect((await releaseUnpaidOrder({ orderId, reason: "admin_cancelled" })).outcome).toBe("already_released");
      expect((await db.select().from(products).where(eq(products.id, source.id)))[0]?.stock).toBe(beforeProduct.stock);
      expect((await db.select().from(coupons).where(eq(coupons.id, coupon.id)))[0]?.usedCount).toBe(coupon.usedCount);
      expect((await db.select().from(couponRedemptions).where(eq(couponRedemptions.orderId, orderId)))[0]?.status).toBe("released");

      const verification = await applyPaymentVerification(attempt.id, { status: "paid", amountRial: reservedOrder!.totalRial, transactionId: "late-test-transaction" });
      expect(verification.reviewRequired).toBe(true);
      const [lateOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
      expect(lateOrder).toMatchObject({ status: "cancelled", paymentStatus: "paid", paymentReviewRequired: true });
      expect((await db.select().from(products).where(eq(products.id, source.id)))[0]?.stock).toBe(beforeProduct.stock);
      expect((await db.select().from(coupons).where(eq(coupons.id, coupon.id)))[0]?.usedCount).toBe(coupon.usedCount);
      expect((await releaseUnpaidOrder({ orderId, reason: "admin_cancelled" })).outcome).toBe("paid");
    } finally {
      if (orderId) {
        await db.delete(paymentAttempts).where(eq(paymentAttempts.orderId, orderId));
        await db.delete(orders).where(eq(orders.id, orderId));
      }
      await db.delete(customers).where(eq(customers.phone, phone));
      await db.update(products).set({ stock: beforeProduct.stock }).where(eq(products.id, source.id));
      await db.update(coupons).set({ usedCount: coupon.usedCount }).where(eq(coupons.id, coupon.id));
    }
  });

  it("maintenance expiry restores aggregate and variant stock exactly once", async () => {
    const db = getDb();
    const productId = 900_000 + Math.floor(Math.random() * 50_000);
    const orderId = `EL-TEST-${randomUUID()}`;
    try {
      await db.insert(products).values({ id: productId, slug: `reservation-${productId}`, name: "محصول تست رزرو", sku: `RES-${productId}`, categorySlug: "test", categoryName: "test", priceRial: 10_000n, regularPriceRial: 10_000n, stock: 9, colors: ["مشکی"], sizes: ["M"] });
      const [variant] = await db.insert(productVariants).values({ productId, sku: `RES-V-${productId}`, size: "M", color: "مشکی", stock: 4 }).returning();
      await db.insert(orders).values({ id: orderId, publicTokenHash: randomUUID(), idempotencyKey: randomUUID(), customerName: "تست", phone: "09999999997", city: "تهران", address: "تست", postalCode: "1234567890", shippingMethod: "تحویل حضوری", subtotalRial: 10_000n, totalRial: 10_000n, reservationExpiresAt: new Date(Date.now() - 60_000) });
      await db.insert(orderItems).values({ orderId, productId, variantId: variant.id, productName: "محصول تست رزرو", sku: variant.sku, size: "M", color: "مشکی", unitPriceRial: 10_000n, quantity: 1, lineTotalRial: 10_000n });
      const first = await expireUnpaidOrderReservations();
      expect(first.released).toBeGreaterThanOrEqual(1);
      expect((await db.select().from(products).where(eq(products.id, productId)))[0]?.stock).toBe(10);
      expect((await db.select().from(productVariants).where(eq(productVariants.id, variant.id)))[0]?.stock).toBe(5);
      const second = await expireUnpaidOrderReservations();
      expect(second.released).toBe(0);
      expect((await db.select().from(products).where(eq(products.id, productId)))[0]?.stock).toBe(10);
      expect((await db.select().from(productVariants).where(eq(productVariants.id, variant.id)))[0]?.stock).toBe(5);
    } finally {
      await db.delete(orders).where(eq(orders.id, orderId));
      await db.delete(products).where(eq(products.id, productId));
    }
  });
});
