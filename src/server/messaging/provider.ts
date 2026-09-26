import "server-only";

export type MessageSendResult =
  | { ok: true; status: "sent"; providerMessageId?: string }
  | { ok: false; code: string; message: string; retryable: boolean };

export interface MessageProvider {
  readonly key: string;
  sendOtp(input: { phone: string; code: string; templateKey: string }): Promise<MessageSendResult>;
  sendTransactional(input: { phone: string; templateKey: string; parameters: Record<string, string> }): Promise<MessageSendResult>;
}

class DevelopmentMessageProvider implements MessageProvider {
  readonly key = "development";
  private assertDevelopment() {
    if (process.env.NODE_ENV === "production") throw new Error("Development message provider is disabled in production");
  }
  async sendOtp(input: { phone: string; code: string }): Promise<MessageSendResult> {
    this.assertDevelopment();
    console.info(`[development-otp] ${input.phone}: ${input.code}`);
    return { ok: true, status: "sent", providerMessageId: `dev-${Date.now()}` };
  }
  async sendTransactional(input: { phone: string; templateKey: string }): Promise<MessageSendResult> {
    this.assertDevelopment();
    console.info(`[development-message] ${input.templateKey} -> ${input.phone}`);
    return { ok: true, status: "sent", providerMessageId: `dev-${Date.now()}` };
  }
}

class WebhookMessageProvider implements MessageProvider {
  readonly key = "webhook";
  private async send(payload: Record<string, unknown>): Promise<MessageSendResult> {
    const url = process.env.MESSAGE_WEBHOOK_URL?.trim() || process.env.OTP_WEBHOOK_URL?.trim();
    const token = process.env.MESSAGE_WEBHOOK_TOKEN?.trim() || process.env.OTP_WEBHOOK_TOKEN?.trim();
    if (!url || !token) return { ok: false, code: "configuration_incomplete", message: "Message webhook configuration is incomplete", retryable: false };
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10_000) });
      const body = await response.json().catch(() => ({})) as { messageId?: unknown; id?: unknown; error?: unknown };
      if (!response.ok) return { ok: false, code: `http_${response.status}`, message: typeof body.error === "string" ? body.error.slice(0, 300) : `Message provider rejected request (${response.status})`, retryable: response.status >= 500 };
      const providerMessageId = typeof body.messageId === "string" ? body.messageId : typeof body.id === "string" ? body.id : undefined;
      return { ok: true, status: "sent", providerMessageId };
    } catch (error) {
      return { ok: false, code: "network_error", message: error instanceof Error ? error.message.slice(0, 300) : "Message provider request failed", retryable: true };
    }
  }
  sendOtp(input: { phone: string; code: string; templateKey: string }) {
    return this.send({ type: "otp", phone: input.phone, code: input.code, templateKey: input.templateKey });
  }
  sendTransactional(input: { phone: string; templateKey: string; parameters: Record<string, string> }) {
    return this.send({ type: "transactional", phone: input.phone, templateKey: input.templateKey, parameters: input.parameters });
  }
}

export function getMessageProvider(): MessageProvider {
  const provider = (process.env.MESSAGE_PROVIDER || process.env.OTP_PROVIDER || "development").trim().toLowerCase();
  if (provider === "development") return new DevelopmentMessageProvider();
  if (provider === "webhook") return new WebhookMessageProvider();
  if (provider === "none" || provider === "disabled") throw new Error("Message provider is disabled");
  throw new Error(`Unsupported MESSAGE_PROVIDER: ${provider}`);
}
