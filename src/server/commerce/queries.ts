import "server-only";

import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { coupons, customers, orderItems, orders } from "@/db/schema";
import { rialToToman } from "@/lib/structured-data";
import type { Coupon, Customer, Order, OrderStatus, PaymentStatus } from "@/types/store";

const ORDER_STATUSES = new Set<OrderStatus>(["pending", "processing", "shipped", "delivered", "cancelled"]);
const PAYMENT_STATUSES = new Set<PaymentStatus>(["pending", "paid", "refunded", "failed"]);

function orderStatus(value: string): OrderStatus {
  if (!ORDER_STATUSES.has(value as OrderStatus)) throw new Error(`Invalid order status: ${value}`);
  return value as OrderStatus;
}

function paymentStatus(value: string): PaymentStatus {
  if (!PAYMENT_STATUSES.has(value as PaymentStatus)) throw new Error(`Invalid payment status: ${value}`);
  return value as PaymentStatus;
}

export async function getOrders(customerId?: number): Promise<Order[]> {
  const db = getDb();
  const orderRows = customerId === undefined
    ? await db.select().from(orders).orderBy(desc(orders.createdAt))
    : await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  const orderIds = orderRows.map((order) => order.id);
  const itemRows = orderIds.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)) : [];
  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  return orderRows.map((order): Order => ({
    id: order.id,
    customerId: order.customerId ?? 0,
    customerName: order.customerName,
    phone: order.phone,
    city: order.city,
    address: order.address,
    postalCode: order.postalCode,
    customerNote: order.customerNote,
    createdAt: order.createdAt.toISOString(),
    subtotal: rialToToman(order.subtotalRial),
    discount: rialToToman(order.discountRial),
    shipping: rialToToman(order.shippingRial),
    total: rialToToman(order.totalRial),
    couponCode: order.couponCode ?? undefined,
    status: orderStatus(order.status),
    paymentStatus: paymentStatus(order.paymentStatus),
    shippingMethod: order.shippingMethod,
    trackingCode: order.trackingCode ?? undefined,
    internalNote: order.internalNote ?? undefined,
    items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
      productId: item.productId ?? 0,
      name: item.productName,
      price: rialToToman(item.unitPriceRial),
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
  }));
}

export async function getCoupons(): Promise<Coupon[]> {
  const rows = await getDb().select().from(coupons).orderBy(desc(coupons.createdAt));
  return rows.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type as Coupon["type"],
    value: coupon.type === "percent" ? coupon.percentValue ?? 0 : rialToToman(coupon.fixedAmountRial ?? 0n),
    minOrder: rialToToman(coupon.minOrderRial),
    usageLimit: coupon.usageLimit,
    used: coupon.usedCount,
    expiresAt: coupon.expiresAt?.toISOString().slice(0, 10) ?? "",
    active: coupon.active,
  }));
}

export async function getCustomers(): Promise<Customer[]> {
  const db = getDb();
  const [customerRows, orderRows] = await Promise.all([
    db.select().from(customers).orderBy(desc(customers.createdAt)),
    db.select({ customerId: orders.customerId, totalRial: orders.totalRial, status: orders.status }).from(orders),
  ]);
  return customerRows.map((customer) => {
    const customerOrders = orderRows.filter((order) => order.customerId === customer.id && order.status !== "cancelled");
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      city: customer.city,
      ordersCount: customerOrders.length,
      totalSpent: customerOrders.reduce((sum, order) => sum + rialToToman(order.totalRial), 0),
      joinedAt: new Intl.DateTimeFormat("fa-IR").format(customer.createdAt),
      active: customer.active,
    };
  });
}
