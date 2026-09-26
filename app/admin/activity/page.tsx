import { Search } from "lucide-react";
import { requireAdmin } from "@/server/auth/admin-session";
import { getRecentAdminActivity } from "@/server/audit/queries";

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin(["owner", "admin"]);
  const [{ q = "" }, activity] = await Promise.all([searchParams, getRecentAdminActivity()]);
  const term = q.trim().toLowerCase();
  const filtered = term ? activity.filter((item) => `${item.actorEmail} ${item.action} ${item.entityType} ${item.entityId || ""}`.toLowerCase().includes(term)) : activity;
  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div><p className="text-[10px] font-bold text-brand">امنیت و عملیات</p><h1 className="mt-1 text-2xl font-black">گزارش فعالیت مدیران</h1><p className="mt-1.5 text-[10px] text-muted">آخرین تغییرات حساس ثبت‌شده در پنل مدیریت.</p></div>
    <form className="relative max-w-md"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input name="q" defaultValue={q} className="h-11 w-full rounded-xl border border-border bg-white pr-10 pl-3 text-[11px] outline-none" placeholder="مدیر، عملیات یا شناسه هدف..." /></form>
    <section className="overflow-hidden rounded-2xl border border-black/5 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="px-5 py-3">زمان</th><th className="px-3 py-3">مدیر</th><th className="px-3 py-3">عملیات</th><th className="px-3 py-3">هدف</th><th className="px-3 py-3">مبدأ</th><th className="px-5 py-3">شناسه پیگیری</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((item) => <tr key={item.id}><td className="px-5 py-3.5">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "medium" }).format(item.createdAt)}</td><td className="px-3 py-3.5" dir="ltr">{item.actorEmail}</td><td className="px-3 py-3.5 font-bold" dir="ltr">{item.action}</td><td className="px-3 py-3.5" dir="ltr">{item.entityType}{item.entityId ? ` / ${item.entityId}` : ""}</td><td className="px-3 py-3.5" dir="ltr">{item.source}</td><td className="px-5 py-3.5 text-[8px] text-muted" dir="ltr">{item.correlationId}</td></tr>)}</tbody></table></div>{!filtered.length && <p className="py-16 text-center text-xs text-muted">فعالیتی پیدا نشد.</p>}</section>
  </div>;
}
