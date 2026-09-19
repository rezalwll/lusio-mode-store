import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Bell, ChartNoAxesCombined, ChevronLeft, LayoutDashboard, ListTree, LogOut, Menu, Package, Palette, Percent, Search, Settings, ShoppingCart, Store, Tags, Users, X } from "lucide-react";
import { useState } from "react";
import { logoUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/use-store";
import { AdminLogin } from "./AdminLogin";

const navigation = [
  { label: "داشبورد", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "سفارش‌ها", to: "/admin/orders", icon: ShoppingCart, exact: false },
  { label: "محصولات", to: "/admin/products", icon: Package, exact: false },
  { label: "مشتریان", to: "/admin/customers", icon: Users, exact: false },
  { label: "دسته‌بندی‌ها", to: "/admin/categories", icon: Tags, exact: false },
  { label: "کدهای تخفیف", to: "/admin/coupons", icon: Percent, exact: false },
  { label: "گزارش‌های فروش", to: "/admin/reports", icon: ChartNoAxesCombined, exact: false },
  { label: "ظاهر و محتوا", to: "/admin/appearance", icon: Palette, exact: false },
  { label: "منو و چیدمان", to: "/admin/navigation", icon: ListTree, exact: false },
  { label: "تنظیمات و محتوا", to: "/admin/settings", icon: Settings, exact: false },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const logout = useStore((state) => state.logoutAdmin);
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col bg-[#181818] text-white">
      <div className="flex h-19 items-center border-b border-white/8 px-5"><img src={logoUrl} alt="ELEVEN" className="h-12 w-36 brightness-0 invert" /><span className="mr-auto rounded-full bg-white/8 px-2 py-1 text-[8px] text-white/45">ADMIN</span></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5"><p className="mb-3 px-3 text-[9px] font-bold text-white/30">مدیریت فروشگاه</p>{navigation.map((item) => <Link key={item.to} to={item.to} activeOptions={{ exact: item.exact }} activeProps={{ className: "!bg-white !text-ink shadow-sm" }} onClick={onNavigate} className="flex h-11 items-center gap-3 rounded-xl px-3 text-[11px] font-medium text-white/58 transition hover:bg-white/8 hover:text-white"><item.icon className="size-4.5" /><span>{item.label}</span></Link>)}</nav>
      <div className="border-t border-white/8 p-3"><Link to="/" onClick={onNavigate} className="flex h-11 items-center gap-3 rounded-xl px-3 text-[10px] text-white/55 hover:bg-white/8 hover:text-white"><Store className="size-4.5" />مشاهده فروشگاه<ChevronLeft className="mr-auto size-4" /></Link><button type="button" onClick={() => { logout(); void navigate({ to: "/admin" }); }} className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[10px] text-rose-300/70 hover:bg-white/8 hover:text-rose-200"><LogOut className="size-4.5" />خروج از مدیریت</button></div>
    </div>
  );
}

export function AdminLayout() {
  const authenticated = useStore((state) => state.adminAuthenticated);
  const orders = useStore((state) => state.orders);
  const products = useStore((state) => state.products);
  const lowStockThreshold = useStore((state) => state.settings.lowStockThreshold ?? 5);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!authenticated) return <AdminLogin />;
  const pendingCount = orders.filter((item) => item.status === "pending").length;
  const lowStockCount = products.filter((item) => item.active && item.stock <= lowStockThreshold).length;

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-ink lg:grid lg:grid-cols-[252px_1fr]">
      <aside className="fixed inset-y-0 right-0 z-50 hidden w-[252px] lg:block"><Sidebar /></aside>
      <div className={cn("fixed inset-0 z-60 bg-black/50 transition lg:hidden", menuOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setMenuOpen(false)}><aside className={cn("relative h-full w-[290px] max-w-[86vw] transition-transform duration-300", menuOpen ? "translate-x-0" : "translate-x-full")} onClick={(event) => event.stopPropagation()}><button type="button" className="absolute left-3 top-5 z-10 grid size-8 place-items-center rounded-full bg-white/8 text-white" onClick={() => setMenuOpen(false)}><X className="size-4" /></button><Sidebar onNavigate={() => setMenuOpen(false)} /></aside></div>
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-40 flex h-19 items-center gap-3 border-b border-black/5 bg-white/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-xl border border-border lg:hidden"><Menu className="size-5" /></button>
          <label className="relative hidden w-full max-w-md sm:block"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input type="search" placeholder="جستجو در مدیریت..." className="h-10 w-full rounded-xl border-0 bg-stone-100 pr-10 pl-3 text-[11px] outline-none focus:ring-2 focus:ring-brand/15" /></label>
          <div className="mr-auto flex items-center gap-1"><button type="button" className="relative grid size-10 place-items-center rounded-xl text-muted hover:bg-stone-100"><Bell className="size-5" />{pendingCount > 0 && <i className="absolute left-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-brand" />}</button><div className="mr-2 flex items-center gap-2 border-r border-border pr-3"><span className="grid size-9 place-items-center rounded-full bg-ink text-[10px] font-black text-white">م‌ع</span><div className="hidden sm:block"><strong className="block text-[10px]">مدیر فروشگاه</strong><small className="text-[8px] text-muted">{lowStockCount} محصول کم‌موجودی</small></div></div></div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
