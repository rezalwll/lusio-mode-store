import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { customers, customerSessions } from "@/db/schema";
import { shouldUseSecureSessionCookie } from "./cookie-options";

const COOKIE_NAME = "eleven_customer_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export interface CustomerSessionUser {
  id: number;
  phone: string;
  name: string;
  email: string;
  city: string;
  address: string;
  postalCode: string;
}

export async function createCustomerSession(customerId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await getDb().insert(customerSessions).values({ tokenHash: hashToken(token), customerId, expiresAt });
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: shouldUseSecureSessionCookie(), path: "/", expires: expiresAt });
}

export async function getCustomerSession(): Promise<CustomerSessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [customer] = await getDb().select({ id: customers.id, phone: customers.phone, name: customers.name, email: customers.email, city: customers.city, address: customers.address, postalCode: customers.postalCode })
    .from(customerSessions).innerJoin(customers, eq(customerSessions.customerId, customers.id))
    .where(and(eq(customerSessions.tokenHash, hashToken(token)), gt(customerSessions.expiresAt, new Date()), eq(customers.active, true))).limit(1);
  return customer ? { ...customer, email: customer.email ?? "" } : null;
}

export async function destroyCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await getDb().delete(customerSessions).where(eq(customerSessions.tokenHash, hashToken(token)));
  cookieStore.delete(COOKIE_NAME);
}
