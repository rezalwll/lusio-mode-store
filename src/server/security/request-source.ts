import "server-only";

import { isIP } from "node:net";
import { headers } from "next/headers";
import { getCoreEnvironment } from "@/server/config/env";

function normalizedAddress(value: string | null) {
  const address = value?.trim().replace(/^\[|\]$/g, "") || "";
  return isIP(address) ? address : "";
}

export function requestSourceFromHeaders(input: Headers) {
  if (!getCoreEnvironment().trustProxyHeaders) return "direct";
  const forwarded = input.get("x-forwarded-for")?.split(",").map((item) => normalizedAddress(item)).find(Boolean);
  return forwarded || normalizedAddress(input.get("x-real-ip")) || "proxy-unknown";
}

export async function getRequestSource() {
  return requestSourceFromHeaders(await headers());
}
