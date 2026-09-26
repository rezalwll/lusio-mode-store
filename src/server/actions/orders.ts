"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { adminAuditLogs, orderItems, orders, products, productVariants } from "@/db/schema";
import { adminAuditValues, createAdminAuditContext } from "@/server/audit/admin-audit";
import { requireAdmin } from "@/server/auth/admin-session";
import { notifyOrderStatusChanged } from "@/server/messaging/service";
import { logServer } from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/origin";
import { orderUpdateSchema } from "@/server/validation/admin-commerce";
import type { OrderStatus } from "@/types/store";

type Input = { id: string; status?: OrderStatus; trackingCode?: string; internalNote?: string };
type Result = { ok: true } | { ok: false; message: string };

export async function updateOrderAction(input: Input): Promise<Result> {
  await assertSameOrigin();
  const actor = await requireAdmin(["owner", "admin", "staff"]);
  const audit = await createAdminAuditContext(actor);
  const parsed = orderUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "اطلاعات سفارش معتبر نیست" };
  try {
    let notification: { customerId?: number; phone: string; orderId: string; status: string; trackingCode?: string } | undefined;
    await getDb().transaction(async (tx) => {
      const [current] = await tx.select().from(orders).where(eq(orders.id, parsed.data.id)).for("update").limit(1);
      if (!current) throw new Error("ORDER_NOT_FOUND");
      if (current.status === "cancelled" && parsed.data.status && parsed.data.status !== "cancelled") throw new Error("CANCELLED_FINAL");
      if (parsed.data.status === "cancelled" && current.status !== "cancelled") {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, current.id));
        for (const item of items) {
          if (item.productId) await tx.update(products).set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() }).where(eq(products.id, item.productId));
          if (item.variantId) await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${item.quantity}`, updatedAt: new Date() }).where(eq(productVariants.id, item.variantId));
        }
      }
      await tx.update(orders).set({
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.trackingCode !== undefined ? { trackingCode: parsed.data.trackingCode || null } : {}),
        ...(parsed.data.internalNote !== undefined ? { internalNote: parsed.data.internalNote || null } : {}),
        updatedAt: new Date(),
      }).where(eq(orders.id, current.id));
      await tx.insert(adminAuditLogs).values(adminAuditValues(audit, {
        action: "order.update",
        entityType: "order",
        entityId: current.id,
        metadata: {
          previousStatus: current.status,
          nextStatus: parsed.data.status ?? current.status,
          trackingChanged: parsed.data.trackingCode !== undefined && parsed.data.trackingCode !== (current.trackingCode ?? ""),
          noteChanged: parsed.data.internalNote !== undefined && parsed.data.internalNote !== (current.internalNote ?? ""),
        },
      }));
      if (parsed.data.status && parsed.data.status !== current.status) {
        notification = { customerId: current.customerId ?? undefined, phone: current.phone, orderId: current.id, status: parsed.data.status, trackingCode: parsed.data.trackingCode || current.trackingCode || undefined };
      }
    });
    if (notification) await notifyOrderStatusChanged(notification);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return { ok: false, message: "سفارش پیدا نشد" };
    if (error instanceof Error && error.message === "CANCELLED_FINAL") return { ok: false, message: "سفارش لغوشده را نمی‌توان دوباره فعال کرد" };
    logServer("error", "order.update.failed", "Order update failed", { orderId: input.id }, error);
    return { ok: false, message: "به‌روزرسانی سفارش انجام نشد" };
  }
}
