import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "./admin-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
