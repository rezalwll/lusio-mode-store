import "server-only";

import { getPaymentEnvironment } from "@/server/config/env";

export type ProviderPaymentStatus = "paid" | "pending" | "failed" | "cancelled";

export interface CreatePaymentRequest {
  attemptId: string;
  orderId: string;
  amountRial: bigint;
  callbackUrl: string;
  idempotencyKey: string;
}

export type CreatePaymentResult =
  | { ok: true; authority: string; redirectUrl: string; providerReference?: string; metadata?: Record<string, unknown> }
  | { ok: false; code: string; message: string; retryable: boolean };

export interface ProviderCallback {
  authority: string;
  providerEventId?: string;
  statusHint?: string;
  metadata?: Record<string, unknown>;
}

export interface VerifyPaymentResult {
  status: ProviderPaymentStatus;
  amountRial?: bigint;
  transactionId?: string;
  failureCode?: string;
  failureMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly key: string;
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResult>;
  parseCallback(input: { url: URL; method: string; body: Record<string, unknown> }): Promise<ProviderCallback>;
  verifyPayment(input: { authority: string; expectedAmountRial: bigint; orderId: string }): Promise<VerifyPaymentResult>;
  queryPayment?(input: { authority: string; expectedAmountRial: bigint; orderId: string }): Promise<VerifyPaymentResult>;
}

class UnconfiguredPaymentProvider implements PaymentProvider {
  readonly key = "none";
  async createPayment(): Promise<CreatePaymentResult> {
    return { ok: false, code: "provider_unconfigured", message: "درگاه پرداخت هنوز پیکربندی نشده است", retryable: false };
  }
  async parseCallback(): Promise<ProviderCallback> {
    throw new Error("Payment callback is unavailable while provider is unconfigured");
  }
  async verifyPayment(): Promise<VerifyPaymentResult> {
    return { status: "failed", failureCode: "provider_unconfigured", failureMessage: "Payment provider is unconfigured" };
  }
}

const unconfiguredProvider = new UnconfiguredPaymentProvider();

export function getConfiguredPaymentProvider(): PaymentProvider {
  const key = getPaymentEnvironment().provider;
  if (key === "none" || key === "disabled") return unconfiguredProvider;
  throw new Error(`Unsupported PAYMENT_PROVIDER: ${key}`);
}

export function getPaymentProviderForCallback(key: string): PaymentProvider {
  const provider = getConfiguredPaymentProvider();
  if (provider.key !== key || provider.key === "none") throw new Error("Payment provider is unavailable");
  return provider;
}
