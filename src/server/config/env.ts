import "server-only";

import { z } from "zod";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function booleanEnvironment(name: string, fallback: boolean) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false`);
}

export function getCoreEnvironment() {
  const databaseUrl = required("DATABASE_URL");
  z.url().parse(databaseUrl);
  const appOriginValue = process.env.APP_ORIGIN?.trim();
  const appOrigin = appOriginValue ? z.url().parse(appOriginValue).replace(/\/$/, "") : undefined;
  const secureCookie = booleanEnvironment("SESSION_COOKIE_SECURE", process.env.NODE_ENV === "production");
  if (process.env.NODE_ENV === "production" && appOrigin?.startsWith("https://") && !secureCookie) throw new Error("SESSION_COOKIE_SECURE must be true for an HTTPS production origin");
  return { databaseUrl, appOrigin, secureCookie, trustProxyHeaders: booleanEnvironment("TRUST_PROXY_HEADERS", false) };
}

export function getPaymentEnvironment() {
  const provider = (process.env.PAYMENT_PROVIDER || "none").trim().toLowerCase();
  if (!["none", "disabled"].includes(provider)) throw new Error(`Unsupported PAYMENT_PROVIDER: ${provider}`);
  return { provider };
}

export function getMessageEnvironment() {
  const provider = (process.env.MESSAGE_PROVIDER || process.env.OTP_PROVIDER || "development").trim().toLowerCase();
  if (!["development", "webhook", "none", "disabled"].includes(provider)) throw new Error(`Unsupported MESSAGE_PROVIDER: ${provider}`);
  if (process.env.NODE_ENV === "production" && provider === "development") throw new Error("Development message provider is disabled in production");
  if (provider === "webhook") {
    const webhookUrl = process.env.MESSAGE_WEBHOOK_URL?.trim() || process.env.OTP_WEBHOOK_URL?.trim();
    const webhookToken = process.env.MESSAGE_WEBHOOK_TOKEN?.trim() || process.env.OTP_WEBHOOK_TOKEN?.trim();
    if (!webhookUrl || !webhookToken) throw new Error("MESSAGE_WEBHOOK_URL and MESSAGE_WEBHOOK_TOKEN are required for webhook messaging");
    z.url().parse(webhookUrl);
    return { provider, webhookUrl, webhookToken };
  }
  return { provider };
}

export function getMediaEnvironment() {
  const driver = (process.env.MEDIA_STORAGE_DRIVER || "local").trim().toLowerCase();
  if (driver !== "local" && driver !== "s3") throw new Error("MEDIA_STORAGE_DRIVER must be local or s3");
  if (driver === "local") return { driver } as const;
  return {
    driver,
    bucket: required("S3_BUCKET"),
    publicBaseUrl: z.url().parse(required("S3_PUBLIC_BASE_URL")).replace(/\/$/, ""),
    endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
    region: process.env.S3_REGION?.trim() || "auto",
    forcePathStyle: booleanEnvironment("S3_FORCE_PATH_STYLE", false),
    accessKeyId: required("S3_ACCESS_KEY_ID"),
    secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
  } as const;
}

export function validateRuntimeEnvironment() {
  getCoreEnvironment();
  getPaymentEnvironment();
  getMessageEnvironment();
  getMediaEnvironment();
}
