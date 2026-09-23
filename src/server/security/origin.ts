import "server-only";

import { headers } from "next/headers";

export async function assertSameOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (!origin) return;
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host || new URL(origin).host !== host) throw new Error("Cross-site mutation rejected");
}
