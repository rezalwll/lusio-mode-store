# Verification

پوشش عمداً سبک و متمرکز بر مسیرهای حیاتی است.

- `npm run lint` — ESLint و قواعد React Compiler
- `npm run typecheck` — TypeScript project references
- `npm run test` — تست‌های واحد/UI و pricing/validation
- `npm run db:check` — سازگاری snapshotهای Drizzle
- `npm run test:db` — parity کاتالوگ و تراکنش checkout روی PostgreSQL واقعی
- `npm run build` — build تولید Next.js
- `npm run test:e2e` — smoke فروشگاه، ورود واقعی مدیر، صفحات اصلی پنل و ثبت سفارش pending روی Chromium دسکتاپ/موبایل

CI سه job دارد: quality، database integration و e2e با PostgreSQL service. تست‌های تصویری در `npm run test:visual` محلی‌اند چون baseline فعلی وابسته به renderer سیستم‌عامل است و در CI اجرا نمی‌شود.

E2E از credential موقت CI که فقط در workflow تعریف شده استفاده می‌کند. هیچ credential تولیدی در repository قرار ندارد.
