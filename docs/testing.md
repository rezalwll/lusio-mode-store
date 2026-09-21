# Testing baseline

Commands:

- `npm run test` — Vitest unit suite (`vitest run`, single pass).
- `npm run test:watch` — Vitest in watch mode for local development.
- `npm run test:e2e` — Playwright end-to-end suite (Chromium; builds the app
  and serves the production build on port 4173 automatically).
- `npm run check` — `lint` + `typecheck` + `test` + `build` in one go.

## Unit tests (`src/**/*.test.{ts,tsx}`)

- `src/lib/format.test.ts` — Persian digits, fa-IR grouping, Toman suffix, date rendering.
- `src/lib/utils.test.ts` — `cn()` class merging/conflict resolution.
- `src/lib/catalog.test.ts` — catalog mapping from `assets/data` JSON:
  unique ids, slug/name/sku fallbacks, stable pricing, category fallback,
  stock boundary. Fabricated demo stock is asserted only at the boundary and
  labeled `DEMO BASELINE BEHAVIOR — TO BE REPLACED BY SERVER INVENTORY`.
- `src/store/cart.test.ts` — add/merge/clamp/update/remove/clear cart lines,
  stock boundary, per-test Zustand + localStorage isolation.
- `src/hooks/use-cart-lines.test.ts` — derived line totals, subtotal, count.
- `src/store/coupons.test.ts` — active/inactive coupon lookup, minimum-order
  gate, percent/fixed math, subtotal cap, and the demo admin login, labeled
  `DEMO-ONLY BASELINE — REMOVE IN AUTH PHASE`.
- `src/components/ui/button.test.tsx` — infrastructure sanity check (React
  rendering, Testing Library, jest-dom matchers, user-event).

## E2E tests (`tests/e2e/`, Chromium only)

- `storefront.spec.ts` — smoke coverage for `/`, `/shop`, one real category,
  one real product, `/cart`, `/checkout`, `/account`, `/tracking`.
- `admin.spec.ts` — demo-auth login screen, wrong-password rejection, and the
  dashboard/products/orders/customers/settings pages (`DEMO-ONLY ADMIN AUTH
  BASELINE`).
- `checkout.spec.ts` — one full demo checkout path ending in the order
  confirmation (`DEMO CHECKOUT BASELINE — FAKE PAYMENT FLOW`). No real payment
  exists; do not treat this as payment coverage.
- `screenshots-desktop.spec.ts` / `screenshots-mobile.spec.ts` — deterministic
  visual baselines (animations disabled, remote imagery/fonts blocked, dynamic
  date masked, fonts settled before capture).

Screenshot baselines live in `tests/e2e/screenshots/<project>/` and are
platform-independent by config (`snapshotPathTemplate`); pixel comparison
allows a small tolerance (`maxDiffPixels`) for font antialiasing.

## E2E determinism notes

- Tests run against `vite preview` of a fresh production build (port 4173),
  never `vite dev`: repo-root legacy `*.html` files would otherwise shadow
  same-name SPA routes (e.g. `/cart` serving legacy `cart.html`).
- External requests (catalog imagery, Google Fonts) are blocked in-test: a
  hanging font stylesheet otherwise stalls `DOMContentLoaded` for ~30s per
  navigation. Nothing asserted depends on remote assets.
