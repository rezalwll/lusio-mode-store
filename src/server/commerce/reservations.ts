import "server-only";

import { and, eq, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { adminAuditLogs, couponRedemptions, coupons, orderItems, orders, paymentAttempts, products, productVariants } from "@/db/schema";
import { adminAuditValues, type AdminAuditContext } from "@/server/audit/admin-audit";
import { createCorrelationId } from "@/server/observability/correlation";
import { logServer } from "@/server/observability/logger";

const ACTIVE_PAYMENT_ATTEMPTS = ["created", "awaiting_user", "verifying"] as const;
export type OrderReleaseReason = "admin_cancelled" | "reservation_expired";

export type ReleaseOrderResult =
  | { outcome: "released"; orderId: string; customerId?: number; phone: string }
  | { outcome: "already_released"; orderId: string }
  | { outcome: "paid"; orderId: string }
  | { outcome: "not_found"; orderId: string };

export async function releaseUnpaidOrder(input: { orderId: string; reason: OrderReleaseReason; correlationId?: string; audit?: AdminAuditContext }): Promise<ReleaseOrderResult> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const now = new Date();
  const result = await getDb().transaction(async (tx): Promise<ReleaseOrderResult> => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).for("update").limit(1);
    if (!order) return { outcome: "not_found", orderId: input.orderId };
    if (order.paymentStatus === "paid") return { outcome: "paid", orderId: order.id };
    if (order.inventoryReleasedAt) return { outcome: "already_released", orderId: order.id };

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const item of items) {
      if (item.productId) await tx.update(products).set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: now }).where(eq(products.id, item.productId));
      if (item.variantId) await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${item.quantity}`, updatedAt: now }).where(eq(productVariants.id, item.variantId));
    }

    const [redemption] = await tx.select().from(couponRedemptions).where(eq(couponRedemptions.orderId, order.id)).for("update").limit(1);
    if (redemption?.status === "reserved") {
      const released = await tx.update(couponRedemptions).set({ status: "released", releasedAt: now })
        .where(and(eq(couponRedemptions.id, redemption.id), eq(couponRedemptions.status, "reserved")))
        .returning({ id: couponRedemptions.id });
      if (released[0]) await tx.update(coupons).set({ usedCount: sql`greatest(${coupons.usedCount} - 1, 0)`, updatedAt: now }).where(eq(coupons.id, redemption.couponId));
    }

    await tx.update(paymentAttempts).set({
      status: input.reason === "reservation_expired" ? "expired" : "cancelled",
      failureCode: input.reason,
      failureMessage: input.reason === "reservation_expired" ? "Order payment reservation expired" : "Order cancelled by administrator",
      updatedAt: now,
    }).where(and(eq(paymentAttempts.orderId, order.id), inArray(paymentAttempts.status, [...ACTIVE_PAYMENT_ATTEMPTS])));
    await tx.update(orders).set({
      status: "cancelled",
      inventoryReleasedAt: now,
      cancelledAt: now,
      cancellationReason: input.reason,
      updatedAt: now,
    }).where(eq(orders.id, order.id));
    if (input.audit) {
      await tx.insert(adminAuditLogs).values(adminAuditValues(input.audit, {
        action: "order.cancel_unpaid",
        entityType: "order",
        entityId: order.id,
        metadata: { reason: input.reason, resourcesReleased: true },
      }));
    }
    return { outcome: "released", orderId: order.id, customerId: order.customerId ?? undefined, phone: order.phone };
  });

  if (result.outcome === "paid") {
    logServer("warn", "order.release.skipped_paid", "Paid order resource release was refused", { correlationId, orderId: input.orderId, reason: input.reason });
  } else if (result.outcome === "released") {
    logServer("info", "order.resources.released", "Order inventory and coupon reservation released", { correlationId, orderId: input.orderId, reason: input.reason });
    if (input.reason === "reservation_expired") logServer("info", "order.reservation.expired", "Unpaid order reservation expired", { correlationId, orderId: input.orderId });
  }
  return result;
}

export async function expireUnpaidOrderReservations({ now = new Date(), limit = 100 } = {}) {
  const candidates = await getDb().select({ id: orders.id }).from(orders).where(and(
    ne(orders.paymentStatus, "paid"),
    isNull(orders.inventoryReleasedAt),
    lt(orders.reservationExpiresAt, now),
  )).limit(limit);
  let released = 0;
  let skippedPaid = 0;
  for (const candidate of candidates) {
    const result = await releaseUnpaidOrder({ orderId: candidate.id, reason: "reservation_expired" });
    if (result.outcome === "released") released += 1;
    if (result.outcome === "paid") skippedPaid += 1;
  }
  return { examined: candidates.length, released, skippedPaid };
}
