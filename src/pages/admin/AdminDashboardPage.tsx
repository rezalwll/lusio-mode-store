import { Link } from "@tanstack/react-router";
import { ArrowLeft, Banknote, Package, ShoppingBag, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { orderStatusClass, orderStatusLabels } from "@/lib/admin";
import { formatNumber, formatToman, toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";

const salesTrend = [
  { day: "شنبه", sales: 12_400_000 }, { day: "یکشنبه", sales: 18_900_000 },
  { day: "دوشنبه", sales: 15_600_000 }, { day: "سه‌شنبه", sales: 24_800_000 },
  { day: "چهارشنبه", sales: 21_200_000 }, { day: "پنجشنبه", sales: 31_400_000 },
  { day: "جمعه", sales: 27_600_000 },
];

export function AdminDashboardPage() {
  const products = useStore((state) => state.products);
  const orders = useStore((state) => state.orders);
  const customers = useStore((state) => state.customers);
  const sales = orders.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.total, 0);
  const lowStock = products.filter((item) => item.active && item.stock <= 5).length;
  const todayOrders = orders.filter((item) => item.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const dateLabel = useMemo(() => new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()), []);
  const metrics = [
    { label: "فروش ثبت‌شده", value: formatToman(sales), change: "+۱۲.۵٪", icon: Banknote, tone: "bg-emerald-50 text-emerald-700" },
    { label: "سفارش‌های امروز", value: toFa(todayOrders || orders.filter((item) => item.status === "pending").length), change: "+۸.۲٪", icon: ShoppingBag, tone: "bg-blue-50 text-blue-700" },
    { label: "محصولات فعال", value: toFa(products.filter((item) => item.active).length), change: `${toFa(lowStock)} کم‌موجودی`, icon: Package, tone: "bg-amber-50 text-amber-700" },
    { label: "مشتریان", value: toFa(customers.length), change: "+۲۴ این ماه", icon: Users, tone: "bg-violet-50 text-violet-700" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold text-brand">{dateLabel}</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">سلام، روزت بخیر 👋</h1><p className="mt-1.5 text-[11px] text-muted">خلاصه عملکرد فروشگاه الون استایل را اینجا می‌بینی.</p></div><Link to="/" className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-border bg-white px-4 text-[10px] font-bold shadow-sm sm:self-auto">مشاهده فروشگاه <ArrowLeft className="size-4" /></Link></div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_3px_16px_rgba(0,0,0,.025)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-medium text-muted">{metric.label}</p><strong className="mt-2 block text-lg font-black sm:text-xl">{metric.value}</strong></div><span className={`grid size-10 place-items-center rounded-xl ${metric.tone}`}><metric.icon className="size-5" /></span></div><div className="mt-4 flex items-center gap-1.5 text-[8px] text-muted"><TrendingUp className="size-3.5 text-emerald-600" /><b className="text-emerald-700">{metric.change}</b><span>نسبت به دوره قبل</span></div></article>)}</section>

      <section className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <article className="min-w-0 rounded-2xl border border-black/5 bg-white p-5 shadow-[0_3px_16px_rgba(0,0,0,.025)] sm:p-6"><div className="mb-6 flex items-start justify-between"><div><h2 className="text-xs font-black">روند فروش هفتگی</h2><p className="mt-1 text-[9px] text-muted">مبلغ فروش در ۷ روز گذشته</p></div><div className="text-left"><strong className="text-sm font-black">{formatToman(salesTrend.reduce((sum, item) => sum + item.sales, 0))}</strong><p className="text-[8px] text-muted">فروش کل هفته</p></div></div><div className="h-[250px]" dir="ltr"><ResponsiveContainer width="100%" height="100%"><AreaChart data={salesTrend} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#d3213a" stopOpacity={0.28} /><stop offset="95%" stopColor="#d3213a" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#ecece8" strokeDasharray="4 4" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#888" }} tickMargin={10} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#999" }} tickFormatter={(value) => `${Math.round(value / 1_000_000)}م`} /><Tooltip formatter={(value) => [formatToman(Number(value)), "فروش"]} contentStyle={{ borderRadius: 12, border: "1px solid #e9e9e5", fontFamily: "Vazirmatn", fontSize: 10 }} /><Area type="monotone" dataKey="sales" stroke="#d3213a" strokeWidth={2.5} fill="url(#salesFill)" /></AreaChart></ResponsiveContainer></div></article>
        <article className="rounded-2xl bg-[#1a1a1a] p-6 text-white shadow-sm"><p className="text-[9px] text-white/45">هدف فروش ماهانه</p><div className="mt-6 flex items-end justify-between"><strong className="text-3xl font-black">۷۳٪</strong><span className="text-[9px] font-bold text-emerald-400">+۹٪ این هفته</span></div><p className="mt-1 text-[8px] text-white/40">تا امروز محقق شده</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[73%] rounded-full bg-brand" /></div><dl className="mt-7 space-y-4 text-[9px]"><div className="flex justify-between border-b border-white/10 pb-3"><dt className="text-white/40">فروش فعلی</dt><dd className="font-bold">۳۶۵٬۴۰۰٬۰۰۰ تومان</dd></div><div className="flex justify-between border-b border-white/10 pb-3"><dt className="text-white/40">هدف ماه</dt><dd className="font-bold">۵۰۰٬۰۰۰٬۰۰۰ تومان</dd></div><div className="flex justify-between"><dt className="text-white/40">باقی‌مانده</dt><dd className="font-bold text-amber-300">۱۳۴٬۶۰۰٬۰۰۰ تومان</dd></div></dl></article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_3px_16px_rgba(0,0,0,.025)]"><div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6"><div><h2 className="text-xs font-black">آخرین سفارش‌ها</h2><p className="mt-1 text-[9px] text-muted">آخرین فعالیت فروشگاه</p></div><Link to="/admin/orders" className="text-[9px] font-bold text-brand">مشاهده همه</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="px-5 py-3 font-medium">سفارش</th><th className="px-3 py-3 font-medium">مشتری</th><th className="px-3 py-3 font-medium">تاریخ</th><th className="px-3 py-3 font-medium">مبلغ</th><th className="px-5 py-3 font-medium">وضعیت</th></tr></thead><tbody className="divide-y divide-border">{orders.slice(0, 5).map((order) => <tr key={order.id} className="hover:bg-stone-50/60"><td className="px-5 py-3.5 font-black" dir="ltr">{order.id}</td><td className="px-3 py-3.5"><strong className="block text-[10px]">{order.customerName}</strong><span className="text-[8px] text-muted">{order.city}</span></td><td className="px-3 py-3.5 text-muted">{new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(order.createdAt))}</td><td className="px-3 py-3.5 font-bold">{formatNumber(order.total)} تومان</td><td className="px-5 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 font-bold ring-1 ring-inset ${orderStatusClass[order.status]}`}>{orderStatusLabels[order.status]}</span></td></tr>)}</tbody></table></div></section>

      {lowStock > 0 && <section className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800"><TriangleAlert className="size-5 shrink-0" /><div><p className="text-[10px] font-black">هشدار موجودی انبار</p><p className="mt-0.5 text-[9px]">{toFa(lowStock)} محصول کم‌موجود یا ناموجود است.</p></div><Link to="/admin/products" className="mr-auto rounded-lg bg-white px-3 py-2 text-[9px] font-bold shadow-sm">بررسی محصولات</Link></section>}
    </div>
  );
}
