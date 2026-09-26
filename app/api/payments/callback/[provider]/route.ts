import { NextResponse } from "next/server";
import { processPaymentCallback } from "@/server/payment/service";

async function callback(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const result = await processPaymentCallback(provider, request);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status });
}

export const GET = callback;
export const POST = callback;
