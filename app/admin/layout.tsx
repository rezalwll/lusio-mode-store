import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "./admin-shell";
import { requireAdmin } from "@/server/auth/admin-session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function AdminGroupLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
