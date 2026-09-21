# A1 — Baseline Audit

Audit-only record. No application code, dependencies, configuration, or
`package.json` were modified to produce this document.

- Audit date: 2026-09-21
- Branch: `codex/a1-baseline-audit`
- HEAD SHA audited: `4e358b6afe59b1c3dc408452ab82c04ef39b0851`
  (`feat(admin): add filterable sales reports and inventory alerts`)
- Node: `v24.20.0`
- npm: `11.19.0`
- Files under `src/`: **46** (recounted via
  `(Get-ChildItem -Recurse -LiteralPath "src" -File | Measure-Object).Count`;
  this corrects the earlier A1 report, which stated 47)

## package.json scripts (verbatim)

```json
{
  "dev": "vite --host 0.0.0.0 --port 8080",
  "build": "tsc -b && vite build",
  "preview": "vite preview --host 0.0.0.0 --port 8080",
  "typecheck": "tsc -b --pretty false"
}
```

## Application routes (`src/app/router.tsx`)

Store layout (`StoreLayout`), path prefix `/`:

| Route | Path | Component source |
|---|---|---|
| home | `/` | `HomePage` |
| shop | `shop` (+ search `q`, `category`, `sort`) | `ShopPage` |
| category | `category/$slug` | `ShopPage` (`lockedCategory`) |
| product | `product/$slug` | `ProductPage` |
| cart | `cart` | `CartPage` |
| checkout | `checkout` | `CheckoutPage` |
| account | `account` | `AccountPage` |
| tracking | `tracking` (+ search `code`) | `TrackingPage` |

Admin layout (`AdminLayout`), path prefix `admin`:

| Route | Path | Component source |
|---|---|---|
| admin index | `/` | `AdminDashboardPage` |
| orders | `orders` | `AdminOrdersPage` |
| products | `products` | `AdminProductsPage` |
| customers | `customers` | `AdminCustomersPage` |
| categories | `categories` | `AdminCategoriesPage` |
| coupons | `coupons` | `AdminCouponsPage` |
| reports | `reports` | `AdminReportsPage` |
| appearance | `appearance` | `AdminAppearancePage` |
| navigation | `navigation` | `AdminNavigationPage` |
| settings | `settings` | `AdminSettingsPage` |

Unknown paths render `ComingSoonPage` (`notFoundComponent`,
`title="صفحه موردنظر پیدا نشد"`).

### Eager vs lazy

- Eager (static `import` in `router.tsx`): `StoreLayout`, `AdminLayout`,
  `ComingSoonPage`, `HomePage`, `AccountPage`, `CartPage`, `CheckoutPage`,
  `ProductPage`, `ShopPage`, `TrackingPage`.
- Lazy (`lazyRouteComponent(() => import(...))`): all 10 admin pages listed
  above (dashboard, orders, products, customers, categories, coupons, reports,
  appearance, navigation, settings). No storefront route is lazy.

## Tests

No project tests exist. There are no `*.test.*` / `*.spec.*` files and no
`__tests__` directories outside `node_modules` (matches found only inside
`node_modules`, e.g. `@hookform/resolvers`, `zod`), and `package.json` has no
test script.

## CI

`.github/workflows` does not exist (there is no `.github` directory at all).

## `npm ci` — result: PASS (after retry)

First attempt failed with `EPERM` because the project's own Vite dev server
(port 8080, started earlier in this session) held a lock on
`node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node`:

```text
npm error code EPERM
npm error syscall unlink
npm error path C:\Users\pajoo\OneDrive\Документы\Default Project\lusio-mode-store\node_modules\lightningcss-win32-x64-msvc\lightningcss.win32-x64-msvc.node
npm error errno -4048
```

This was an environment file lock, not a lockfile inconsistency
(`package-lock.json` is present and consistent). After stopping the dev
server processes (vite PID 34836, `npm run dev` PID 29476) and confirming
port 8080 was free, `npm ci` passed:

```text
added 101 packages, and audited 102 packages in 7s

23 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## `npm run typecheck` — result: PASS

```text
> lusio-mode-store@2.0.0 typecheck
> tsc -b --pretty false
```

No errors, no output beyond the command echo.

## `npm run build` — result: PASS (with one chunk-size warning)

```text
> lusio-mode-store@2.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 2517 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                  0.63 kB │ gzip:   0.38 kB
dist/assets/logo-eleven-C6jLRPAi.png            33.24 kB
dist/assets/index-C_zaFOSf.css                  63.08 kB │ gzip:  11.59 kB
dist/assets/download-CaO5mL_k.js                 0.22 kB │ gzip:   0.18 kB
dist/assets/banknote-D6abt-3Y.js                 0.23 kB │ gzip:   0.20 kB
dist/assets/triangle-alert-kw4yYQ1S.js           0.25 kB │ gzip:   0.20 kB
dist/assets/pen-line-Cp1hPaLW.js                 0.26 kB │ gzip:   0.21 kB
dist/assets/save-BKWMRMxG.js                     0.31 kB │ gzip:   0.22 kB
dist/assets/file-text-CDTXqBe-.js                0.32 kB │ gzip:   0.20 kB
dist/assets/admin-CTwqjl_6.js                    0.58 kB │ gzip:   0.31 kB
dist/assets/image-Ba1f5fHO.js                    1.05 kB │ gzip:   0.67 kB
dist/assets/Modal-DqQPGl5V.js                    1.38 kB │ gzip:   0.75 kB
dist/assets/AdminCategoriesPage-BfApHlin.js      5.07 kB │ gzip:   2.15 kB
dist/assets/AdminCouponsPage-BwMh4Phv.js         5.79 kB │ gzip:   2.07 kB
dist/assets/AdminCustomersPage-BXyq-7j1.js       6.42 kB │ gzip:   2.25 kB
dist/assets/AdminNavigationPage-IWFrj1XO.js      8.56 kB │ gzip:   2.73 kB
dist/assets/AdminDashboardPage-CUKgtKel.js       9.59 kB │ gzip:   3.11 kB
dist/assets/AdminReportsPage-BgEqD-6o.js        11.06 kB │ gzip:   3.56 kB
dist/assets/AdminOrdersPage-CpA4hLXE.js         12.34 kB │ gzip:   4.18 kB
dist/assets/AdminAppearancePage-CVKSn5sW.js     14.48 kB │ gzip:   3.85 kB
dist/assets/AdminSettingsPage-Bik5u19Q.js       17.76 kB │ gzip:   5.00 kB
dist/assets/AdminProductsPage-Bkjpee-p.js       25.86 kB │ gzip:   7.75 kB
dist/assets/AreaChart-BDD9H0T2.js              351.08 kB │ gzip: 101.72 kB
dist/assets/index-DHQJgPdk.js                1,697.95 kB │ gzip: 244.84 kB

[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 9.57s
```

Recorded for evidence only; per audit scope, no fix is applied.

## TanStack Query usage

`@tanstack/react-query` is a declared dependency, but there is **no actual
`useQuery`, `useMutation`, or API usage** in `src/`. The only references are
in `src/main.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});
<QueryClientProvider client={queryClient}> ... </QueryClientProvider>
```

A repo-wide search for `fetch(`, `axios`, `useMutation`, `useInfiniteQuery`,
and `useSuspenseQuery` under `src/` returned no matches. Data flows through
the Zustand store (`src/store/use-store.ts`), seeded from `assets/data` and
persisted to browser storage.
