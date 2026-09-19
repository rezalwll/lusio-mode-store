# Lusio Mode Store — Eleven Style

نسخه مدرن فروشگاه پوشاک مردانه الون استایل با ویترین فروشگاهی و پنل مدیریت یکپارچه.

## فناوری‌ها

- React 19 + TypeScript 7
- Vite 8 + Tailwind CSS 4
- TanStack Router و TanStack Query
- Zustand برای وضعیت و داده‌های فروشگاه
- React Hook Form + Zod برای فرم‌ها
- Recharts برای گزارش‌های مدیریتی

## اجرا

```bash
npm install
npm run dev
```

بررسی نسخه تولید:

```bash
npm run build
npm run preview
```

داده‌های کاتالوگ فعلی از فایل‌های `assets/data` خوانده می‌شوند و تغییرات فروشگاه و پنل مدیریت در فضای ذخیره‌سازی مرورگر نگه‌داری می‌شوند تا پروژه بدون وابستگی به سرویس خارجی نیز قابل اجرا باشد.

فایل‌های HTML قدیمی در ریشه مخزن صرفاً به‌عنوان خروجی نسخه قبلی حفظ شده‌اند؛ ورودی نسخه جدید `index.html` و کد اصلی داخل `src` است.
