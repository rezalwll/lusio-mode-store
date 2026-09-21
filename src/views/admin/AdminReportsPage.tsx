"use client";

import { Banknote, Box, ChartNoAxesCombined, Download, PackageCheck, ReceiptText, ShoppingCart, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { orderStatusLabels } from "@/lib/admin";
import { formatToman, toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { OrderStatus } from "@/types/store";

type Range = "7" | "30" | "90" | "all";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-amber-400",
  processing: "bg-blue-500",
  shipped: "bg-violet-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-400",
};

function downloadCsv(rows: Array<Array<string | number>>, fileName: string) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminReportsPage() {
  const orders = useStore((state) => state.orders);
  const customers = useStore((state) => state.customers);
  const [range, setRange] = useState<Range>("30");
  const filteredOrders = useMemo(() => {
    if (range === "all") return orders;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (Number(range) - 1));
    return orders.filter((order) => new Date(order.createdAt) >= start);
  }, [orders, range]);
  const successfulOrders = filteredOrders.filter((order) => order.status !== "cancelled");
  const revenue = successfulOrders.reduce((sum, order) => sum + order.total, 0);
  const itemsSold = successfulOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const averageOrder = successfulOrders.length ? Math.round(revenue / successfulOrders.length) : 0;
  const deliveredRate = successfulOrders.length ? Math.round((successfulOrders.filter((order) => order.status === "delivered").length / successfulOrders.length) * 100) : 0;

  const salesTrend = useMemo(() => {
    const dayCount = range === "all" ? Math.max(7, Math.ceil((Date.now() - Math.min(...orders.map((order) => new Date(order.createdAt).getTime()), Date.now())) / 86_400_000) + 1) : Number(range);
    return Array.from({ length: Math.min(dayCount, 90) }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (Math.min(dayCount, 90) - 1 - index));
      const key = date.toISOString().slice(0, 10);
      const dailyOrders = successfulOrders.filter((order) => order.createdAt.slice(0, 10) === key);
      return { date: new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(date), sales: dailyOrders.reduce((sum, order) => sum + order.total, 0), orders: dailyOrders.length };
    });
  }, [orders, range, successfulOrders]);

  const topProducts = useMemo(() => {
    const result = new Map<number, { name: string; quantity: number; revenue: number }>();
    successfulOrders.forEach((order) => order.items.forEach((item) => {
      const current = result.get(item.productId) ?? { name: item.name, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      result.set(item.productId, current);
    }));
    return [...result.entries()].map(([id, value]) => ({ id, ...value })).sort((a, b) => b.quantity - a.quantity).slice(0, 8);
  }, [successfulOrders]);

  const topCustomers = useMemo(() => {
    const result = new Map<number, { name: string; orders: number; spent: number }>();
    successfulOrders.forEach((order) => {
      const current = result.get(order.customerId) ?? { name: order.customerName, orders: 0, spent: 0 };
      current.orders += 1;
      current.spent += order.total;
      result.set(order.customerId, current);
    });
    return [...result.entries()].map(([id, value]) => ({ id, ...value })).sort((a, b) => b.spent - a.spent).slice(0, 5);
  }, [successfulOrders]);

  const statusBreakdown = (Object.keys(statusColors) as OrderStatus[]).map((status) => ({ status, count: filteredOrders.filter((order) => order.status === status).length }));
  const maxProductQuantity = Math.max(...topProducts.map((item) => item.quantity), 1);
  const metrics = [
    { label: "فروش خالص", value: formatToman(revenue), detail: `${toFa(successfulOrders.length)} سفارش غیرلغوشده`, icon: Banknote, tone: "bg-emerald-50 text-emerald-700" },
    { label: "میانگین هر سفارش", value: formatToman(averageOrder), detail: "ارزش متوسط سبد خرید", icon: ReceiptText, tone: "bg-blue-50 text-blue-700" },
    { label: "تعداد کالای فروخته‌شده", value: toFa(itemsSold), detail: `${toFa(topProducts.length)} محصول در گزارش`, icon: Box, tone: "bg-violet-50 text-violet-700" },
    { label: "نرخ تحویل", value: `${toFa(deliveredRate)}٪`, detail: "از سفارش‌های غیرلغوشده", icon: PackageCheck, tone: "bg-amber-50 text-amber-700" },
  ];

  function exportReport() {
    downloadCsv([
      ["شماره سفارش", "مشتری", "تاریخ", "مبلغ", "وضعیت", "تعداد اقلام"],
      ...filteredOrders.map((order) => [order.id, order.customerName, order.createdAt.slice(0, 10), order.total, orderStatusLabels[order.status], order.items.reduce((sum, item) => sum + item.quantity, 0)]),
    ], `eleven-sales-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold text-brand">تحلیل عملکرد فروشگاه</p><h1 className="mt-1 text-2xl font-black">گزارش‌های فروش</h1><p className="mt-1.5 text-[10px] text-muted">فروش، سفارش‌ها، محصولات و مشتریان را در بازه‌های مختلف بررسی کنید.</p></div><div className="flex gap-2"><select value={range} onChange={(event) => setRange(event.target.value as Range)} className="h-11 rounded-xl border border-border bg-white px-4 text-[10px] font-bold outline-none"><option value="7">۷ روز گذشته</option><option value="30">۳۰ روز گذشته</option><option value="90">۹۰ روز گذشته</option><option value="all">از ابتدا</option></select><Button variant="outline" onClick={exportReport}><Download className="size-4" />خروجی CSV</Button></div></div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-black/5 bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[9px] text-muted">{metric.label}</p><strong className="mt-2 block text-lg font-black">{metric.value}</strong></div><span className={`grid size-10 place-items-center rounded-xl ${metric.tone}`}><metric.icon className="size-5" /></span></div><p className="mt-4 text-[8px] text-muted">{metric.detail}</p></article>)}</section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <article className="min-w-0 rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div className="mb-6"><h2 className="text-xs font-black">روند فروش</h2><p className="mt-1 text-[9px] text-muted">فروش روزانه در بازه انتخاب‌شده</p></div><div className="h-[300px]" dir="ltr"><ResponsiveContainer width="100%" height="100%"><AreaChart data={salesTrend} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#ecece8" strokeDasharray="4 4" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#888" }} tickMargin={10} minTickGap={24} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#999" }} tickFormatter={(value) => `${Math.round(value / 1_000_000)}م`} /><Tooltip formatter={(value, name) => [name === "sales" ? formatToman(Number(value)) : toFa(Number(value)), name === "sales" ? "فروش" : "سفارش"]} contentStyle={{ borderRadius: 12, border: "1px solid #e9e9e5", fontFamily: "Vazirmatn", fontSize: 10 }} /><Area type="monotone" dataKey="sales" stroke="#8f4d59" strokeWidth={2.5} fill="#8f4d59" fillOpacity={0.12} /></AreaChart></ResponsiveContainer></div></article>
        <article className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-stone-100"><ChartNoAxesCombined className="size-5" /></span><div><h2 className="text-xs font-black">وضعیت سفارش‌ها</h2><p className="mt-1 text-[9px] text-muted">توزیع سفارش‌ها در این بازه</p></div></div><div className="mt-7 space-y-5">{statusBreakdown.map((item) => { const percent = filteredOrders.length ? Math.round((item.count / filteredOrders.length) * 100) : 0; return <div key={item.status}><div className="mb-2 flex justify-between text-[9px]"><span className="font-bold">{orderStatusLabels[item.status]}</span><span className="text-muted">{toFa(item.count)} سفارش · {toFa(percent)}٪</span></div><div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className={`h-full rounded-full ${statusColors[item.status]}`} style={{ width: `${percent}%` }} /></div></div>; })}</div></article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <article className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><ShoppingCart className="size-5" /></span><div><h2 className="text-xs font-black">محصولات پرفروش</h2><p className="mt-1 text-[9px] text-muted">رتبه‌بندی بر اساس تعداد فروش</p></div></div>{topProducts.length ? <div className="mt-6 space-y-4">{topProducts.map((product, index) => <div key={product.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3"><span className="grid size-7 place-items-center rounded-lg bg-stone-100 text-[9px] font-black">{toFa(index + 1)}</span><div className="min-w-0"><div className="flex justify-between gap-3"><strong className="truncate text-[10px]">{product.name}</strong><span className="shrink-0 text-[9px] text-muted">{toFa(product.quantity)} عدد</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-brand" style={{ width: `${(product.quantity / maxProductQuantity) * 100}%` }} /></div></div><span className="text-[9px] font-bold">{formatToman(product.revenue)}</span></div>)}</div> : <p className="mt-8 rounded-xl border border-dashed border-border py-10 text-center text-[10px] text-muted">در این بازه فروشی ثبت نشده است.</p>}</article>
        <article className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Users className="size-5" /></span><div><h2 className="text-xs font-black">مشتریان برتر</h2><p className="mt-1 text-[9px] text-muted">بر اساس خرید در بازه انتخاب‌شده</p></div></div><div className="mt-5 divide-y divide-border">{topCustomers.map((customer, index) => <div key={customer.id} className="flex items-center gap-3 py-3.5"><span className="grid size-8 place-items-center rounded-full bg-ink text-[9px] font-black text-white">{toFa(index + 1)}</span><div><strong className="block text-[10px]">{customer.name}</strong><span className="text-[8px] text-muted">{toFa(customer.orders)} سفارش</span></div><strong className="mr-auto text-[9px]">{formatToman(customer.spent)}</strong></div>)}</div>{customers.length > 0 && topCustomers.length === 0 && <p className="py-10 text-center text-[10px] text-muted">خریدی در این بازه ثبت نشده است.</p>}</article>
      </section>
    </div>
  );
}
