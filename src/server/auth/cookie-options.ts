import "server-only";

import { getCoreEnvironment } from "@/server/config/env";

export function shouldUseSecureSessionCookie() {
  return getCoreEnvironment().secureCookie;
}
