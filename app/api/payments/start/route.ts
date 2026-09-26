import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { startPayment } from "@/server/payment/service";
import { assertSameOrigin } from "@/server/security/origin";

const inputSchema = z.object({ orderId: z.string().min(8).max(80), trackingToken: z.string().min(20).max(200), idempotencyKey: z.uuid() });

export async function POST(request: NextRequest) {
  await assertSameOrigin();
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "درخواست پرداخت معتبر نیست" }, { status: 400 });
  const origin = process.env.APP_ORIGIN?.trim() || request.nextUrl.origin;
  const result = await startPayment({ ...parsed.data, callbackOrigin: origin });
  return result.ok ? NextResponse.json(result) : NextResponse.json({ error: result.message, code: result.code, attemptId: result.attemptId }, { status: result.status });
}
