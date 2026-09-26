import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { outboundMessages } from "@/db/schema";
import { logServer } from "@/server/observability/logger";
import { getMessageProvider, type MessageSendResult } from "./provider";

async function recordAndSend(input: { customerId?: number; phone: string; messageType: "otp" | "transactional"; templateKey: string }, send: () => Promise<MessageSendResult>) {
  const provider = getMessageProvider();
  const [message] = await getDb().insert(outboundMessages).values({ customerId: input.customerId, phone: input.phone, messageType: input.messageType, templateKey: input.templateKey, providerKey: provider.key }).returning();
  let result: MessageSendResult;
  try {
    result = await send();
  } catch (error) {
    result = { ok: false, code: "provider_exception", message: error instanceof Error ? error.message : "Message provider failed", retryable: true };
  }
  await getDb().update(outboundMessages).set(result.ok
    ? { status: "sent", attempts: 1, providerMessageId: result.providerMessageId || null, sentAt: new Date(), updatedAt: new Date() }
    : { status: "failed", attempts: 1, lastError: `${result.code}: ${result.message}`.slice(0, 1_000), updatedAt: new Date() }
  ).where(eq(outboundMessages.id, message.id));
  if (!result.ok) logServer("error", "message.send.failed", "Outbound message failed", { messageId: message.id, provider: provider.key, type: input.messageType, code: result.code });
  return { ...result, messageId: message.id };
}

export async function sendOtpMessage(phone: string, code: string) {
  const provider = getMessageProvider();
  return recordAndSend({ phone, messageType: "otp", templateKey: process.env.OTP_TEMPLATE_KEY || "login" }, () => provider.sendOtp({ phone, code, templateKey: process.env.OTP_TEMPLATE_KEY || "login" }));
}

async function sendOptionalTransactional(input: { customerId?: number; phone: string; templateKey: string; parameters: Record<string, string> }) {
  if ((process.env.TRANSACTIONAL_MESSAGES_ENABLED || "false") !== "true") return { ok: false as const, skipped: true, reason: "disabled" };
  try {
    const provider = getMessageProvider();
    return await recordAndSend({ customerId: input.customerId, phone: input.phone, messageType: "transactional", templateKey: input.templateKey }, () => provider.sendTransactional(input));
  } catch (error) {
    logServer("error", "message.transactional.unavailable", "Transactional notification unavailable", { templateKey: input.templateKey }, error);
    return { ok: false as const, skipped: true, reason: "provider_unavailable" };
  }
}

export function notifyOrderCreated(input: { customerId?: number; phone: string; orderId: string; totalRial: bigint }) {
  return sendOptionalTransactional({ customerId: input.customerId, phone: input.phone, templateKey: "order_created", parameters: { orderId: input.orderId, totalRial: input.totalRial.toString() } });
}

export function notifyOrderStatusChanged(input: { customerId?: number; phone: string; orderId: string; status: string; trackingCode?: string }) {
  return sendOptionalTransactional({ customerId: input.customerId, phone: input.phone, templateKey: input.status === "shipped" ? "order_shipped" : "order_status_changed", parameters: { orderId: input.orderId, status: input.status, trackingCode: input.trackingCode || "" } });
}
