import "server-only";

export interface OtpProvider {
  send(phone: string, code: string): Promise<void>;
}

class DevelopmentOtpProvider implements OtpProvider {
  async send(phone: string, code: string) {
    if (process.env.NODE_ENV === "production") throw new Error("Development OTP provider is disabled in production");
    console.info(`[development-otp] ${phone}: ${code}`);
  }
}

class WebhookOtpProvider implements OtpProvider {
  async send(phone: string, code: string) {
    const url = process.env.OTP_WEBHOOK_URL?.trim();
    const token = process.env.OTP_WEBHOOK_TOKEN?.trim();
    if (!url || !token) throw new Error("OTP webhook configuration is incomplete");
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone, code, template: process.env.OTP_WEBHOOK_TEMPLATE || "login" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`OTP provider rejected request (${response.status})`);
  }
}

export function getOtpProvider(): OtpProvider {
  const provider = process.env.OTP_PROVIDER || "development";
  if (provider === "development") return new DevelopmentOtpProvider();
  if (provider === "webhook") return new WebhookOtpProvider();
  throw new Error(`Unsupported OTP_PROVIDER: ${provider}`);
}

