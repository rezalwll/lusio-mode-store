# Production runbook

## Environment

متغیرهای اجباری:

- `DATABASE_URL` — اتصال TLSدار PostgreSQL با کاربر کم‌اختیار
- `SESSION_COOKIE_SECURE=true` — روی HTTPS؛ نبود این متغیر در `NODE_ENV=production` نیز به‌طور پیش‌فرض secure است
- `OTP_PROVIDER=webhook` و `OTP_HASH_SECRET` طولانی و تصادفی
- `OTP_WEBHOOK_URL` و در صورت نیاز `OTP_WEBHOOK_TOKEN`/`OTP_WEBHOOK_TEMPLATE`
- `MEDIA_STORAGE_DRIVER=s3` و همه `S3_*` شامل bucket خصوصی credential و public base URL/CDN
- `ADMIN_BOOTSTRAP_*` فقط برای اولین seed؛ پس از ساخت مدیر از environment حذف شوند

storage محلی (`MEDIA_STORAGE_DRIVER=local`) فقط برای یک instance توسعه مناسب است و فایل را در `public/uploads` می‌نویسد. برای چند instance یا deployهای immutable حتماً S3-compatible استفاده کنید.

## Release

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run db:check
npm run build
npm run db:migrate
npm run db:seed
npm run start
```

`db:seed` برای داده‌های پایه idempotent است، اما به‌جای migration استفاده نمی‌شود. پیش از migration از دیتابیس backup بگیرید. health check باید دسترسی HTTP به `/` و اتصال app به DB را بررسی کند.

## Rollback

1. ترافیک را از release معیوب خارج کنید.
2. artifact قبلی را بازگردانید.
3. migration را کورکورانه down نکنید؛ SQL فعلی migration برگشتی خودکار ندارد.
4. اگر schema جدید با نسخه قبلی ناسازگار است، از backup تأییدشده restore کنید یا forward-fix بازبینی‌شده اجرا کنید.

## Operational notes

- reverse proxy باید HTTPS، محدودیت body upload و headerهای صحیح `Host`/`X-Forwarded-For` داشته باشد.
- دسترسی bucket، DB و webhook را دوره‌ای rotate کنید.
- cleanup نشست‌های منقضی و OTP challengeهای قدیمی را به job زمان‌بندی‌شده زیرساخت اضافه کنید.
- درگاه پرداخت هنوز پیاده نشده و سفارش‌ها pending هستند؛ پیش از فروش واقعی adapter، callback امضاشده و reconciliation لازم است.
- از دیتابیس و object storage backup مستقل بگیرید و restore را تمرین کنید.
