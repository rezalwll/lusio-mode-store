# PostgreSQL and Drizzle

PostgreSQL منبع حقیقت همه داده‌های تجاری زنده است. فایل‌های قدیمی `assets/data` فقط ورودی seed کاتالوگ‌اند و در مسیر runtime فروشگاه یا پنل fallback نیستند.

## راه‌اندازی توسعه

```bash
docker compose -f compose.db.yml up -d
cp .env.example .env
npm run db:setup
```

در compose توسعه، PostgreSQL روی پورت host برابر `5433` منتشر می‌شود. `db:seed` قابل تکرار است؛ محصول‌ها/دسته‌ها را با ID و slug قبلی upsert می‌کند، تنظیمات و navigation اولیه را فقط در صورت نبود داده می‌سازد و مدیر bootstrap تکراری ایجاد نمی‌کند.

## سیاست migration

- SQLهای پوشه `drizzle/` منبع حقیقت schema هستند؛ در production از `drizzle-kit push` استفاده نکنید.
- ترتیب release: backup، اجرای `npm run db:migrate`، اجرای app، سپس smoke check.
- پول در ستون‌های `*_rial` با `BIGINT` و واحد ریال ذخیره می‌شود؛ UI تومان را نشان می‌دهد و تبدیل صریح است.
- زمان‌ها `timestamptz` و UTC هستند.
- writeهای چندجدولی محصول و سفارش در تراکنش انجام می‌شوند.
- checkout ردیف محصول/واریانت/کوپن را lock و کاهش موجودی را شرطی انجام می‌دهد.

## فرمان‌ها

```bash
npm run db:generate  # تولید migration جدید؛ SQL را پیش از commit بازبینی کنید
npm run db:check
npm run db:migrate
npm run db:seed
npm run test:db
```

بازنشانی volume دستور مخرب است و فقط برای دیتابیس توسعه محلی مجاز است:

```bash
docker compose -f compose.db.yml down -v
```
