"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, ChartNoAxesCombined, ChevronLeft, Images, LayoutDashboard, ListTree, LogOut, Menu, Package, Palette, Percent, Search, Settings, ShoppingCart, Store, Tags, Warehouse, Users, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { logoUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { logoutAdminAction } from "@/server/auth/admin-actions";
import type { AdminSessionUser } from "@/server/auth/admin-session";

const navigation = [
  { label: "داشبورد", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "سفارش‌ها", to: "/admin/orders", icon: ShoppingCart, exact: false },
  { label: "محصولات", to: "/admin/products", icon: Package, exact: false },
  { label: "انبار", to: "/admin/inventory", icon: Warehouse, exact: false },
  { label: "رسانه‌ها", to: "/admin/media", icon: Images, exact: false },
  { label: "مشتریان", to: "/admin/customers", icon: Users, exact: false },
  { label: "دسته‌بندی‌ها", to: "/admin/categories", icon: Tags, exact: false },
  { label: "کدهای تخفیف", to: "/admin/coupons", icon: Percent, exact: false },
  { label: "گزارش‌های فروش", to: "/admin/reports", icon: ChartNoAxesCombined, exact: false },
  { label: "ظاهر و محتوا", to: "/admin/appearance", icon: Palette, exact: false },
  { label: "منو و چیدمان", to: "/admin/navigation", icon: ListTree, exact: false },
  { label: "تنظیمات و محتوا", to: "/admin/settings", icon: Settings, exact: false },
  { label: "گزارش فعالیت", to: "/admin/activity", icon: Activity, exact: false, privileged: true },
] as const;

function Sidebar({ user, onNavigate }: { user: AdminSessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-[#181818] text-white">
      <div className="flex h-19 items-center border-b border-white/8 px-5"><span className="relative block h-12 w-36"><Image src={logoUrl} alt="ELEVEN" fill sizes="144px" className="object-contain brightness-0 invert" /></span><span className="mr-auto rounded-full bg-white/8 px-2 py-1 text-[8px] text-white/45">ADMIN</span></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5"><p className="mb-3 px-3 text-[9px] font-bold text-white/30">مدیریت فروشگاه</p>{navigation.filter((item) => !("privileged" in item && item.privileged) || ["owner", "admin"].includes(user.role)).map((item) => {
        const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
        return <Link key={item.to} href={item.to} onClick={onNavigate} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-[11px] font-medium text-white/58 transition hover:bg-white/8 hover:text-white", active && "!bg-white !text-ink shadow-sm")}><item.icon className="size-4.5" /><span>{item.label}</span></Link>;
      })}</nav>
      <div className="border-t border-white/8 p-3"><Link href="/" onClick={onNavigate} className="flex h-11 items-center gap-3 rounded-xl px-3 text-[10px] text-white/55 hover:bg-white/8 hover:text-white"><Store className="size-4.5" />مشاهده فروشگاه<ChevronLeft className="mr-auto size-4" /></Link><form action={logoutAdminAction}><button type="submit" className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[10px] text-rose-300/70 hover:bg-white/8 hover:text-rose-200"><LogOut className="size-4.5" />خروج امن</button></form></div>
    </div>
  );
}

export function AdminShell({ children, user }: { children: ReactNode; user: AdminSessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const currentModule = navigation.find((item) => item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`));

  function quickSearch(event: FormEvent) {
    event.preventDefault();
    const term = quickQuery.trim();
    if (!term) return;
    const module = navigation.find((item) => item.label.includes(term));
    router.push(module?.to ?? `/admin/products?q=${encodeURIComponent(term)}`);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-ink lg:grid lg:grid-cols-[252px_1fr]">
      <aside className="fixed inset-y-0 right-0 z-50 hidden w-[252px] lg:block"><Sidebar user={user} /></aside>
      <div className={cn("fixed inset-0 z-60 bg-black/50 transition lg:hidden", menuOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setMenuOpen(false)}><aside className={cn("relative h-full w-[290px] max-w-[86vw] transition-transform duration-300", menuOpen ? "translate-x-0" : "translate-x-full")} onClick={(event) => event.stopPropagation()}><button type="button" className="absolute left-3 top-5 z-10 grid size-8 place-items-center rounded-full bg-white/8 text-white" onClick={() => setMenuOpen(false)}><X className="size-4" /></button><Sidebar user={user} onNavigate={() => setMenuOpen(false)} /></aside></div>
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-40 flex h-19 items-center gap-3 border-b border-black/5 bg-white/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-xl border border-border lg:hidden"><Menu className="size-5" /></button>
          <div className="hidden min-w-28 lg:block"><span className="text-[8px] text-muted">پنل مدیریت</span><strong className="block text-[10px]">{currentModule?.label ?? "مدیریت"}</strong></div>
          <form onSubmit={quickSearch} className="relative hidden w-full max-w-md sm:block"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input type="search" value={quickQuery} onChange={(event) => setQuickQuery(event.target.value)} placeholder="نام محصول یا بخش مدیریت..." className="h-10 w-full rounded-xl border-0 bg-stone-100 pr-10 pl-3 text-[11px] outline-none focus:ring-2 focus:ring-brand/15" /></form>
          <div className="mr-auto flex items-center gap-1"><button type="button" className="relative grid size-10 place-items-center rounded-xl text-muted hover:bg-stone-100"><Bell className="size-5" /></button><div className="mr-2 flex items-center gap-2 border-r border-border pr-3"><span className="grid size-9 place-items-center rounded-full bg-ink text-[10px] font-black text-white">{user.name.slice(0, 1)}</span><div className="hidden sm:block"><strong className="block text-[10px]">{user.name}</strong><small className="text-[8px] text-muted" dir="ltr">{user.email}</small></div></div></div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
