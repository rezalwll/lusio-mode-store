import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { couponRedemptions, coupons, customers, orderItems, orders, products, productVariants, storeSettings } from "@/db/schema";
import { tomanToRial } from "@/lib/structured-data";
import { evaluateCoupon, shippingCostRial } from "./pricing";
import { storeSettingsInputSchema } from "@/server/validation/settings";
import type { CheckoutInput } from "@/server/validation/checkout";

export class CommerceError extends Error {
  constructor(public readonly publicMessage: string) { super(publicMessage); }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createOrderId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `EL-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export interface CreatedOrder {
  orderId: string;
  totalRial: bigint;
  paymentStatus: "pending";
  trackingToken?: string;
  reused: boolean;
}

export async function createOrder(input: CheckoutInput): Promise<CreatedOrder> {
  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: orders.id, totalRial: orders.totalRial, paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
      if (existing) return { orderId: existing.id, totalRial: existing.totalRial, paymentStatus: "pending" as const, reused: true };

      const productIds = [...new Set(input.lines.map((line) => line.productId))];
      const productRows = await tx.select().from(products).where(inArray(products.id, productIds)).for("update");
      if (productRows.length !== productIds.length) throw new CommerceError("یکی از محصولات سبد دیگر موجود نیست");
      const productById = new Map(productRows.map((product) => [product.id, product]));
      const variantRows = await tx.select().from(productVariants).where(inArray(productVariants.productId, productIds)).for("update");
      const variantsByProduct = new Map<number, typeof variantRows>();
      for (const variant of variantRows) {
        const list = variantsByProduct.get(variant.productId) ?? [];
        list.push(variant);
        variantsByProduct.set(variant.productId, list);
      }

      const pricedLines = input.lines.map((line) => {
        const product = productById.get(line.productId);
        if (!product?.active || product.status === "archived") throw new CommerceError("یکی از محصولات سبد قابل سفارش نیست");
        const variants = variantsByProduct.get(product.id) ?? [];
        const variant = variants.find((item) => item.active && item.size === line.size && item.color === line.color);
        if (variants.length && !variant) throw new CommerceError(`تنوع انتخاب‌شده برای «${product.name}» موجود نیست`);
        if (!variants.length && (!product.sizes.includes(line.size) || !product.colors.includes(line.color))) throw new CommerceError(`انتخاب رنگ یا سایز «${product.name}» معتبر نیست`);
        const available = variant ? variant.stock : product.stock;
        if (available < line.quantity || product.stock < line.quantity) throw new CommerceError(`موجودی «${product.name}» کافی نیست`);
        const unitPriceRial = variant?.priceRial ?? product.priceRial;
        return { ...line, product, variant, unitPriceRial, lineTotalRial: unitPriceRial * BigInt(line.quantity) };
      });

      const subtotalRial = pricedLines.reduce((sum, line) => sum + line.lineTotalRial, 0n);
      let coupon: typeof coupons.$inferSelect | undefined;
      let discountRial = 0n;
      const couponCode = input.couponCode.trim().toUpperCase();
      if (couponCode) {
        [coupon] = await tx.select().from(coupons).where(eq(coupons.code, couponCode)).for("update").limit(1);
        const evaluation = evaluateCoupon(coupon, subtotalRial);
        if (!evaluation.valid) throw new CommerceError(evaluation.message);
        discountRial = evaluation.discountRial;
      }

      const [settingsRow] = await tx.select({ data: storeSettings.data }).from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
      if (!settingsRow) throw new Error("store settings are not seeded");
      const settings = storeSettingsInputSchema.parse(settingsRow.data);
      const shippingRial = shippingCostRial(
        subtotalRial,
        input.shippingMethod,
        BigInt(tomanToRial(settings.shippingCost)),
        BigInt(tomanToRial(settings.freeShippingThreshold)),
      );
      const totalRial = subtotalRial - discountRial + shippingRial;

      let [customer] = await tx.select().from(customers).where(eq(customers.phone, input.phone)).for("update").limit(1);
      if (customer && !customer.active) throw new CommerceError("حساب این مشتری غیرفعال است؛ با پشتیبانی تماس بگیرید");
      const customerValues = {
        name: `${input.firstName} ${input.lastName}`,
        email: input.email || customer?.email || null,
        city: input.city,
        address: `${input.province}، ${input.city}، ${input.address}`,
        postalCode: input.postalCode,
        updatedAt: new Date(),
      };
      if (customer) {
        [customer] = await tx.update(customers).set(customerValues).where(eq(customers.id, customer.id)).returning();
      } else {
        [customer] = await tx.insert(customers).values({ phone: input.phone, ...customerValues }).returning();
      }

      for (const line of pricedLines) {
        if (line.variant) {
          const updatedVariant = await tx.update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${line.quantity}`, updatedAt: new Date() })
            .where(and(eq(productVariants.id, line.variant.id), sql`${productVariants.stock} >= ${line.quantity}`))
            .returning({ id: productVariants.id });
          if (!updatedVariant[0]) throw new CommerceError(`موجودی «${line.product.name}» هم‌زمان تغییر کرده است`);
        }
        const updatedProduct = await tx.update(products)
          .set({ stock: sql`${products.stock} - ${line.quantity}`, updatedAt: new Date() })
          .where(and(eq(products.id, line.product.id), sql`${products.stock} >= ${line.quantity}`))
          .returning({ id: products.id });
        if (!updatedProduct[0]) throw new CommerceError(`موجودی «${line.product.name}» هم‌زمان تغییر کرده است`);
      }

      const orderId = createOrderId();
      const trackingToken = randomBytes(24).toString("base64url");
      await tx.insert(orders).values({
        id: orderId,
        publicTokenHash: hashToken(trackingToken),
        idempotencyKey: input.idempotencyKey,
        customerId: customer.id,
        customerName: customer.name,
        phone: input.phone,
        city: input.city,
        address: customer.address,
        postalCode: input.postalCode,
        customerNote: input.note,
        shippingMethod: input.shippingMethod,
        subtotalRial,
        discountRial,
        shippingRial,
        totalRial,
        couponId: coupon?.id ?? null,
        couponCode: coupon?.code ?? null,
        status: "pending",
        paymentStatus: "pending",
      });
      await tx.insert(orderItems).values(pricedLines.map((line) => ({
        orderId,
        productId: line.product.id,
        variantId: line.variant?.id ?? null,
        productName: line.product.name,
        sku: line.variant?.sku ?? line.product.sku,
        size: line.size,
        color: line.color,
        unitPriceRial: line.unitPriceRial,
        quantity: line.quantity,
        lineTotalRial: line.lineTotalRial,
      })));
      if (coupon) {
        await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() }).where(eq(coupons.id, coupon.id));
        await tx.insert(couponRedemptions).values({ couponId: coupon.id, orderId, customerId: customer.id, discountRial });
      }
      return { orderId, totalRial, paymentStatus: "pending" as const, trackingToken, reused: false };
    });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "23505") {
      const [existing] = await db.select({ id: orders.id, totalRial: orders.totalRial }).from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
      if (existing) return { orderId: existing.id, totalRial: existing.totalRial, paymentStatus: "pending", reused: true };
      throw new CommerceError("این ایمیل یا اطلاعات سفارش قبلاً ثبت شده است");
    }
    throw error;
  }
}
