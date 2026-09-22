# Data-layer plan: from demo client state to a real backend

Status: catalog database foundation exists (PostgreSQL + Drizzle); the
production runtime still serves the static catalog. Recorded decisions:

- PostgreSQL selected (18.6), Drizzle ORM + Drizzle Kit selected.
- Codebase-first migrations in `drizzle/` (SQL is source of truth).
- DB canonical money unit = `BIGINT` IRR (Rial); seed converts Toman ×10.
- Current UI/domain money remains Toman until the repository cutover.
- Catalog tables (`categories`, `products`, `product_images`,
  `product_categories`) exist and are seeded; `src/server/catalog.ts`
  is NOT switched yet.
- Inventory stock stays transitional (demo semantics preserved).

## 1. Domain audit (current state)

### Product (`Product` in `src/types/store.ts`)
- Source: `assets/data/store-products.json` + `store-products-2.json`,
  mapped once in `src/lib/catalog.ts` → `initialProducts` (dedupe by id,
  slug/name/sku fallbacks, price chain, category fallback, fabricated
  deterministic demo stock, `featured` for first 12).
- Consumers: `src/store/use-store.ts` (seed + admin CRUD), `ShopPage`,
  `ProductPage`, `ProductCard`/`ProductGrid`, cart lines, `app/` product and
  category routes, metadata, sitemap, JSON-LD.
- Future ownership: server catalog (database table, slug unique index);
  stock becomes server inventory, not a mapped fallback.

### Category (`Category` in `src/types/store.ts`)
- Source: `assets/data/store-categories.json` via `src/lib/catalog.ts` →
  `initialCategories` (all `active: true`).
- Consumers: shop filters, category routes, breadcrumbs, sitemap, admin
  categories CRUD (also renames `categoryName` on linked products).
- Future ownership: server catalog (hierarchical categories table).

### Order (`Order` in `src/types/store.ts`)
- Source: hardcoded `initialOrders` in `src/store/use-store.ts` (demo
  history) + client-created via `placeOrder()` (decrements in-memory stock,
  creates/updates the customer row, clears cart/coupon).
- Consumers: admin orders page (status updates, invoice popup, CSV export),
  account order history, tracking lookup by id (+ optional phone match).
- Future ownership: server orders (transactional create, status machine,
  payment linkage). `placeOrder` client logic must move server-side first.

### OrderItem (`CartLine & { name: string; price: number }`)
- Source: snapshot of cart lines enriched with product name/price at
  `placeOrder()` time; cart lines themselves are `{ productId, size, color,
  quantity }` keyed by `productId-size-color`.
- Consumers: order rows, tracking detail, account history.
- Future ownership: server order-items table (FK → orders, snapshot price
  kept for history, variant references normalized later).

### Customer (`Customer` in `src/types/store.ts`)
- Source: hardcoded `initialCustomers` + client-created/updated by
  `placeOrder()` (matched by phone); admin CRUD + active toggle.
- Consumers: admin customers page, account pseudo-login (phone match only —
  demo, not auth), order customer linkage.
- Future ownership: server customers (unique phone/email, server-owned
  counters, real auth replaces phone match).

### Coupon (`Coupon` in `src/types/store.ts`)
- Source: hardcoded `initialCoupons` (e.g. active `ELEVEN10`/`FIRSTBUY`,
  inactive `SUMMER20`) + admin CRUD; applied code kept in
  `appliedCoupon`; math centralized in `src/lib/cart-pricing.ts`
  (`calculateDiscount`: active + case-insensitive match, min-order gate,
  percent rounding, fixed value, subtotal cap).
- Consumers: cart/checkout summaries, admin coupons page.
- Future ownership: server coupons (usage counters transactional, expiry
  enforced at redemption, per-customer limits).

### Settings (`StoreSettings` in `src/types/store.ts`)
- Source: hardcoded `initialSettings` (store identity, theme tokens,
  homepage content, shipping rules, targets) + admin appearance/settings
  editors; persisted to localStorage.
- Consumers: storefront shell theme, homepage sections, shipping math,
  SEO fallbacks, admin studio.
- Future ownership: server settings (cached, admin-edited with audit);
  theme tokens stay client-readable.

### Navigation (`StoreNavigationItem[]` inside settings + `homeSectionOrder`)
- Source: `settings.navigationItems` (category/search modes with fallback
  slugs) resolved by `src/lib/storefront-categories.ts`; admin navigation
  page edits labels/order/visibility.
- Consumers: header desktop/mobile nav, homepage section order.
- Future ownership: server content (menus + homepage layout blocks).

### Admin user/session (boolean `adminAuthenticated` in the store)
- Source: client-side password check (`loginAdmin("eleven1405")` demo),
  persisted flag in the same Zustand store; `AdminLayout` gates on it.
- Consumers: whole `/admin/*` tree, admin login/logout UI.
- Future ownership: server session (httpOnly cookie, RBAC); the persisted
  flag and demo password must be removed in the auth phase, not extended.

## 2. Server data boundary (introduced)

- `src/server/` holds repository-style functions. UI code must not depend on
  storage implementation: server routes import from `src/server/`, never
  from JSON files directly.
- Current backing store is the existing static mapping (`src/lib/catalog.ts`
  exports); prices, slugs, stock, images, categories, and returned shapes
  are unchanged. Swapping the backing store later must not touch callers.
- No API routes were added; no client component imports `src/server/`.

## 3. Future backend direction (options, not decisions)

- ORM candidates: Prisma or Drizzle (both fit Next.js + Postgres; decide in
  the data phase after weighing migration DX vs SQL control).
- IDs: keep numeric catalog ids where they already exist; use UUIDs (or
  identity columns) for orders/customers created server-side; order public
  ids keep the `EL-xxxxx` shape via a sequence.
- Timestamps: `createdAt`/`updatedAt` (UTC) on every table from day one.
- Relationships: categories self-referencing parent; products → categories;
  orders → customers; order items → orders (+ product snapshot fields);
  coupons standalone with a redemptions join later.
- Migration order (later phase): settings/content → catalog (categories,
  products, inventory) → customers → coupons → orders (with payment link) →
  admin sessions last (removes the persisted flag).
- Risks: coupon double-redeem and oversell require real transactions;
  client-computed totals must become server-computed; persisted localStorage
  schema will need a versioned migration path for returning browsers.
