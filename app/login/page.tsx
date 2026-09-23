import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { getAdminSession } from "@/server/auth/admin-session";

export const metadata: Metadata = { title: "ورود مدیریت", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { next } = await searchParams;
  return <AdminLogin next={next?.startsWith("/admin") ? next : "/admin"} />;
}
