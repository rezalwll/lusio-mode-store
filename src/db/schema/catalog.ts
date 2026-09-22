import { bigint, boolean, check, index, integer, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Catalog tables. Mirror of the current static catalog semantics — see
// docs/data-layer-plan.md. Money is canonical IRR (Rial) BIGINT; the
// current UI/domain unit (Toman) is converted x10 at seed time and must
// never be stored in *_rial columns.

export const categories = pgTable("categories", {
  id: integer("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  // Domain parent 0 (root) becomes NULL; self-reference restricted so a
  // category can never point at a missing parent. The thunk return is
  // annotated to keep the self-referencing table inference well-founded.
  parentId: integer("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
  imageUrl: text("image_url").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    // Audit of the current mapped catalog (104 products) proved SKUs unique
    // and non-empty, so the unique constraint is safe without data fixups.
    sku: text("sku").notNull().unique(),
    priceRial: bigint("price_rial", { mode: "bigint" }).notNull(),
    regularPriceRial: bigint("regular_price_rial", { mode: "bigint" }).notNull(),
    onSale: boolean("on_sale").notNull().default(false),
    colors: text("colors").array().notNull().default(sql`'{}'`),
    sizes: text("sizes").array().notNull().default(sql`'{}'`),
    // Transitional demo stock semantics (see data-layer plan); the CHECK only
    // guarantees the invariant every consumer already relies on.
    stock: integer("stock").notNull().default(0),
    active: boolean("active").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    description: text("description").notNull().default(""),
    status: text("status"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    // Transitional verbatim copies of the current primary-category fields.
    // "uncategorized" has no categories row, so these stay plain text rather
    // than a foreign key: source truth is preserved, nothing fabricated.
    categorySlug: text("category_slug").notNull(),
    categoryName: text("category_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("products_stock_non_negative", sql`${table.stock} >= 0`)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("product_images_product_position").on(table.productId, table.position)],
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index("product_categories_category").on(table.categoryId),
  ],
);
