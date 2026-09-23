import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./catalog";

export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    size: text("size").notNull(),
    color: text("color").notNull(),
    stock: integer("stock").notNull().default(0),
    priceRial: bigint("price_rial", { mode: "bigint" }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_variants_product_size_color").on(table.productId, table.size, table.color),
    index("product_variants_product").on(table.productId),
    check("product_variants_stock_non_negative", sql`${table.stock} >= 0`),
    check("product_variants_price_positive", sql`${table.priceRial} IS NULL OR ${table.priceRial} >= 0`),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    objectKey: text("object_key").notNull().unique(),
    publicUrl: text("public_url").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text").notNull().default(""),
    storageDriver: text("storage_driver").notNull().default("local"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("media_assets_size_positive", sql`${table.sizeBytes} > 0`)],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull().unique(),
    email: text("email"),
    name: text("name").notNull(),
    city: text("city").notNull().default(""),
    address: text("address").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    active: boolean("active").notNull().default(true),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("customers_email_unique").on(table.email)],
);

export const customerOtpChallenges = pgTable(
  "customer_otp_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customer_otp_phone_created").on(table.phone, table.createdAt)],
);

export const customerSessions = pgTable(
  "customer_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customer_sessions_customer").on(table.customerId)],
);

export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    type: text("type").notNull(),
    percentValue: integer("percent_value"),
    fixedAmountRial: bigint("fixed_amount_rial", { mode: "bigint" }),
    minOrderRial: bigint("min_order_rial", { mode: "bigint" }).notNull().default(sql`0`),
    usageLimit: integer("usage_limit").notNull().default(0),
    usedCount: integer("used_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("coupons_type_valid", sql`${table.type} IN ('percent', 'fixed')`),
    check("coupons_value_valid", sql`(${table.type} = 'percent' AND ${table.percentValue} BETWEEN 1 AND 100 AND ${table.fixedAmountRial} IS NULL) OR (${table.type} = 'fixed' AND ${table.fixedAmountRial} > 0 AND ${table.percentValue} IS NULL)`),
    check("coupons_limits_non_negative", sql`${table.minOrderRial} >= 0 AND ${table.usageLimit} >= 0 AND ${table.usedCount} >= 0`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    publicTokenHash: text("public_token_hash").notNull().unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    address: text("address").notNull(),
    postalCode: text("postal_code").notNull(),
    shippingMethod: text("shipping_method").notNull(),
    subtotalRial: bigint("subtotal_rial", { mode: "bigint" }).notNull(),
    discountRial: bigint("discount_rial", { mode: "bigint" }).notNull().default(sql`0`),
    shippingRial: bigint("shipping_rial", { mode: "bigint" }).notNull().default(sql`0`),
    totalRial: bigint("total_rial", { mode: "bigint" }).notNull(),
    couponId: integer("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    couponCode: text("coupon_code"),
    status: text("status").notNull().default("pending"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    trackingCode: text("tracking_code"),
    internalNote: text("internal_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("orders_customer_created").on(table.customerId, table.createdAt),
    index("orders_phone_created").on(table.phone, table.createdAt),
    index("orders_status_created").on(table.status, table.createdAt),
    check("orders_status_valid", sql`${table.status} IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')`),
    check("orders_payment_status_valid", sql`${table.paymentStatus} IN ('pending', 'paid', 'refunded', 'failed')`),
    check("orders_amounts_non_negative", sql`${table.subtotalRial} >= 0 AND ${table.discountRial} >= 0 AND ${table.shippingRial} >= 0 AND ${table.totalRial} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    size: text("size").notNull().default(""),
    color: text("color").notNull().default(""),
    unitPriceRial: bigint("unit_price_rial", { mode: "bigint" }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalRial: bigint("line_total_rial", { mode: "bigint" }).notNull(),
  },
  (table) => [
    index("order_items_order").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_amounts_non_negative", sql`${table.unitPriceRial} >= 0 AND ${table.lineTotalRial} >= 0`),
  ],
);

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: serial("id").primaryKey(),
    couponId: integer("coupon_id").notNull().references(() => coupons.id, { onDelete: "restrict" }),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    discountRial: bigint("discount_rial", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("coupon_redemptions_coupon_order").on(table.couponId, table.orderId)],
);

export const storeSettings = pgTable(
  "store_settings",
  {
    id: integer("id").primaryKey().default(1),
    data: jsonb("data").notNull().$type<Record<string, unknown>>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("store_settings_singleton", sql`${table.id} = 1`)],
);

export const navigationItems = pgTable(
  "navigation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    mode: text("mode").notNull(),
    target: text("target").notNull(),
    fallbackSlug: text("fallback_slug").notNull().default(""),
    position: integer("position").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("navigation_items_position").on(table.position),
    check("navigation_items_mode_valid", sql`${table.mode} IN ('category', 'search')`),
  ],
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("staff"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("admin_users_role_valid", sql`${table.role} IN ('owner', 'admin', 'staff', 'editor')`)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("admin_sessions_user").on(table.userId)],
);

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({ sessions: many(adminSessions) }));
export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({ user: one(adminUsers, { fields: [adminSessions.userId], references: [adminUsers.id] }) }));
export const customersRelations = relations(customers, ({ many }) => ({ orders: many(orders), sessions: many(customerSessions) }));
export const ordersRelations = relations(orders, ({ one, many }) => ({ customer: one(customers, { fields: [orders.customerId], references: [customers.id] }), items: many(orderItems) }));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({ order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }) }));
