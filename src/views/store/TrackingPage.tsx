"use client";

import { Box, CheckCircle2, CircleDot, PackageCheck, Search, Truck } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Field";
import { formatDate, formatToman } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { OrderStatus } from "@/types/store";

const statusIndex: Record<OrderStatus, number> = { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1 };
const steps = [
  { label: "ثبت سفارش", icon: CheckCircle2 },
  { label: "آماده‌سازی", icon: PackageCheck },
  { label: "ارسال‌شده", icon: Truck },
  { label: "تحویل‌شده", icon: Box },
];

export function TrackingPage({ initialCode = "" }: { initialCode?: string }) {
  const orders = useStore((state) => state.orders);
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(Boolean(initialCode));
  const order = useMemo(() => orders.find((item) => item.id.toLowerCase() === code.trim().toLowerCase() && (!phone || item.phone === phone.trim())), [orders, code, phone, searched]);

  function submit(event: FormEvent) { event.preventDefault(); setSearched(true); }

  return (
    <div className="container-site py-10 sm:py-16">
      <div className="mx-auto max-w-3xl text-center"><p className="section-eyebrow">وضعیت خرید</p><h1 className="section-title">پیگیری سفارش</h1><p className="mt-3 text-xs leading-6 text-muted">شماره سفارش و شماره موبایل ثبت‌شده را وارد کنید.</p></div>
      <form onSubmit={submit} className="mx-auto mt-8 grid max-w-2xl gap-3 rounded-2xl border border-border bg-stone-50 p-5 sm:grid-cols-[1fr_1fr_auto] sm:p-6">
        <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="شماره سفارش، مثل EL-10248" dir="ltr" required />
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="شماره موبایل (اختیاری)" dir="ltr" inputMode="tel" />
        <Button type="submit"><Search className="size-4" /> بررسی</Button>
      </form>

      {searched && !order && <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center text-xs font-bold text-rose-700">سفارشی با این مشخصات پیدا نشد.</div>}
      {order && (
        <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-border p-5 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] text-muted">شماره سفارش</p><h2 className="mt-1 text-xl font-black" dir="ltr">{order.id}</h2></div><div className="sm:text-left"><p className="text-[10px] text-muted">تاریخ ثبت</p><strong className="mt-1 block text-xs">{formatDate(order.createdAt)}</strong></div></div>
          {order.status === "cancelled" ? <div className="mt-6 rounded-xl bg-rose-50 p-4 text-center text-xs font-bold text-rose-700">این سفارش لغو شده و مبلغ آن بازگشت داده شده است.</div> : (
            <div className="mt-8 grid grid-cols-4">
              {steps.map((step, index) => { const active = index <= statusIndex[order.status]; return <div key={step.label} className="relative flex flex-col items-center text-center after:absolute after:right-1/2 after:top-5 after:-z-10 after:h-0.5 after:w-full after:bg-border last:after:hidden"><span className={`grid size-10 place-items-center rounded-full border-2 bg-white ${active ? "border-brand text-brand" : "border-border text-muted"}`}>{active ? <step.icon className="size-4" /> : <CircleDot className="size-3" />}</span><span className={`mt-2 text-[9px] font-bold sm:text-[11px] ${active ? "text-ink" : "text-muted"}`}>{step.label}</span></div>; })}
            </div>
          )}
          <dl className="mt-8 grid gap-3 rounded-xl bg-stone-50 p-4 text-xs sm:grid-cols-3"><div><dt className="text-[9px] text-muted">تحویل‌گیرنده</dt><dd className="mt-1 font-bold">{order.customerName}</dd></div><div><dt className="text-[9px] text-muted">روش ارسال</dt><dd className="mt-1 font-bold">{order.shippingMethod}</dd></div><div><dt className="text-[9px] text-muted">مبلغ سفارش</dt><dd className="mt-1 font-bold">{formatToman(order.total)}</dd></div></dl>
          {order.trackingCode && <p className="mt-4 text-center text-[10px] text-muted">کد رهگیری مرسوله: <strong className="text-ink" dir="ltr">{order.trackingCode}</strong></p>}
        </section>
      )}
    </div>
  );
}
