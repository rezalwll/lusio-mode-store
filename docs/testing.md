# Testing baseline

Commands:

- `npm run test` — Vitest unit suite (`vitest run`, single pass).
- `npm run test:watch` — Vitest in watch mode for local development.
- `npm run test:e2e` — functional Playwright suite (desktop + mobile
  projects; builds the app and serves the production build on port 4173
  automatically). This is what CI runs.
- `npm run test:visual` — screenshot-comparison suite, LOCAL/MANUAL ONLY
  (see below). Not run in CI.
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
- `src/store/coupons.test.ts` — discount math through the real shared
  `src/lib/cart-pricing.ts` helper (also used by CartPage/CheckoutPage):
  active/inactive lookup, minimum-order gate, percent rounding, fixed cap,
  plus the demo admin login labeled `DEMO-ONLY BASELINE — REMOVE IN AUTH
  PHASE`.
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
- `screenshots-desktop.spec.ts` / `screenshots-mobile.spec.ts` — visual
  baselines (animations disabled, remote imagery/fonts blocked, dynamic
  date masked, fonts settled before capture). LOCAL/MANUAL ONLY, run via
  `npm run test:visual`; see below.

## Screenshot baselines: local reference, not CI enforcement

Screenshot baselines live in `tests/e2e/screenshots/<project>/` and were
generated on Windows. They are a LOCAL VISUAL REFERENCE for migration work,
not a cross-platform regression gate: OS fonts and rendering stacks differ,
and `maxDiffPixels` tolerance only absorbs antialiasing noise — it does not
solve OS rendering differences.

- Functional E2E (`npm run test:e2e`) runs in CI.
- Visual tests (`npm run test:visual`) do NOT run in CI.
- Visual CI enforcement should be enabled only after baselines are
  regenerated in a controlled environment matching CI.
- Screenshots currently render with fallback fonts because remote webfonts
  are blocked in-test; later self-hosted/local fonts will make
  cross-environment rendering more deterministic.

## E2E determinism notes

- Tests run against `next start` of a fresh production build (port 4173),
  never `next dev`.
- External catalog imagery requests are blocked in-test: hanging remote
  requests otherwise stall page load and inflate memory. Nothing asserted
  depends on remote assets (webfonts are self-hosted since Phase 5, so no
  font blocking is needed).
