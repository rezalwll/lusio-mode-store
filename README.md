# Eleven Style Commerce

فروشگاه تمام‌صفحه و RTL پوشاک مردانه ELEVEN با بک‌اند واقعی، PostgreSQL و پنل مدیریت یکپارچه.

## معماری

- Next.js 16 App Router، React 19 و TypeScript 6
- Tailwind CSS 4، React Hook Form، Zod، Recharts و Sonner
- PostgreSQL 18 و Drizzle ORM؛ منبع حقیقت محصولات، دسته‌ها، موجودی، سفارش‌ها، مشتریان، تخفیف‌ها، محتوا و نشست‌ها
- Zustand فقط برای شناسه‌های سبد، کد تخفیف و باز/بسته‌بودن drawer
- نشست مدیر و مشتری با کوکی HttpOnly، توکن تصادفی و hash سمت سرور
- رسانه با پردازش WebP و storage محلی در توسعه یا S3-compatible در production

## راه‌اندازی محلی

پیش‌نیاز: Node.js 24 و Docker/Podman یا یک PostgreSQL در دسترس.

```bash
npm ci
cp .env.example .env
docker compose -f compose.db.yml up -d
npm run db:setup
npm run dev
```

سپس فروشگاه در `http://localhost:8080` و پنل در `/admin` در دسترس است. مدیر اولیه فقط زمانی ساخته می‌شود که `ADMIN_BOOTSTRAP_EMAIL` و `ADMIN_BOOTSTRAP_PASSWORD` قبل از `db:seed` تنظیم شده باشند؛ هیچ رمز پیش‌فرضی داخل پروژه وجود ندارد.

## فرمان‌های اصلی

```bash
npm run db:check       # اعتبارسنجی migrationها
npm run db:migrate     # اعمال migrationهای commit‌شده
npm run db:seed        # seed تکرارپذیر کاتالوگ و تنظیمات
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:db        # نیازمند PostgreSQL
npm run test:e2e       # نیازمند DB migrate/seed شده
```

## وضعیت پرداخت

درگاه پرداخت عمداً هنوز متصل نشده است. checkout قیمت، تخفیف و موجودی را در تراکنش PostgreSQL دوباره محاسبه می‌کند و سفارش را با `payment_status=pending` ثبت می‌کند؛ هیچ پرداخت موفق جعلی ایجاد نمی‌شود. اتصال درگاه باید با adapter و callback تأییدشده سمت سرور اضافه شود.

جزئیات پایگاه داده در [docs/database.md](docs/database.md)، راهنمای استقرار در [docs/production.md](docs/production.md) و پوشش تست در [docs/testing.md](docs/testing.md) آمده است.
