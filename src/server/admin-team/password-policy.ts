import { z } from "zod";

const weakPasswords = new Set(["password", "password123", "123456789012", "qwerty123456", "admin123456", "changeme1234", "change-me-before-production"]);

export const adminPasswordSchema = z.string().min(12, "رمز عبور باید حداقل ۱۲ کاراکتر باشد").max(128, "رمز عبور بیش از حد طولانی است").refine((value) => {
  const normalized = value.trim().toLowerCase();
  return !weakPasswords.has(normalized) && new Set(normalized).size >= 5;
}, "رمز عبور انتخاب‌شده بسیار ضعیف یا آزمایشی است");
