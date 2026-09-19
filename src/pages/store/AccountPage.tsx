import { Link } from "@tanstack/react-router";
import { LogOut, MapPin, Package, Phone, UserRound } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Field";
import { formatDate, formatToman } from "@/lib/format";
import { useStore } from "@/store/use-store";

export function AccountPage() {
  const customers = useStore((state) => state.customers);
  const orders = useStore((state) => state.orders);
  const [phone, setPhone] = useState("");
  const [activePhone, setActivePhone] = useState("");
  const customer = customers.find((item) => item.phone === activePhone);
  const customerOrders = useMemo(() => orders.filter((item) => item.phone === activePhone), [orders, activePhone]);

  function login(event: FormEvent) { event.preventDefault(); setActivePhone(phone.trim()); }

  if (!customer) {
    return (
      <div className="container-site flex min-h-[65vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-border p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,.06)] sm:p-9">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-stone-100"><UserRound className="size-7" /></span>
          <h1 className="mt-5 text-2xl font-black">ورود به حساب کاربری</h1>
          <p className="mt-2 text-xs leading-6 text-muted">شماره موبایلی که با آن خرید کرده‌اید وارد کنید.</p>
          <form onSubmit={login} className="mt-6"><Input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" dir="ltr" placeholder="09123456789" required /><Button type="submit" className="mt-3 w-full">ورود با شماره موبایل</Button></form>
          {activePhone && !customer && <p className="mt-3 text-[10px] font-bold text-rose-600">حسابی با این شماره پیدا نشد. برای مشاهده نمونه از 09123458712 استفاده کنید.</p>}
          <p className="mt-5 text-[9px] leading-5 text-muted">با ورود به حساب، قوانین و حریم خصوصی فروشگاه را می‌پذیرید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-site py-10 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-ink text-sm font-black text-white">{customer.name.slice(0, 2)}</span><div><p className="text-[10px] text-muted">خوش آمدید</p><h1 className="text-xl font-black">{customer.name}</h1></div></div><Button variant="outline" size="sm" onClick={() => { setActivePhone(""); setPhone(""); }}><LogOut className="size-4" /> خروج</Button></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-border p-5"><h2 className="text-xs font-black">اطلاعات حساب</h2><div className="mt-4 grid gap-3 text-[11px] text-muted"><p className="flex items-center gap-2"><Phone className="size-4" /><span dir="ltr">{customer.phone}</span></p><p className="flex items-center gap-2"><MapPin className="size-4" />{customer.city}</p><p className="flex items-center gap-2"><Package className="size-4" />{customer.ordersCount} سفارش ثبت‌شده</p></div></aside>
        <section><h2 className="text-sm font-black">سفارش‌های من</h2><div className="mt-4 grid gap-3">{customerOrders.length ? customerOrders.map((order) => <article key={order.id} className="rounded-2xl border border-border p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-xs" dir="ltr">{order.id}</strong><p className="mt-1 text-[9px] text-muted">{formatDate(order.createdAt)} · {order.items.length} قلم</p></div><div className="text-left"><strong className="text-xs">{formatToman(order.total)}</strong><p className="mt-1 text-[9px] text-muted">{order.shippingMethod}</p></div></div><Link to="/tracking" search={{ code: order.id }} className="mt-4 inline-flex rounded-lg bg-stone-100 px-3 py-2 text-[10px] font-bold hover:bg-stone-200">مشاهده وضعیت سفارش</Link></article>) : <div className="rounded-2xl border border-dashed border-border py-14 text-center text-xs text-muted">هنوز سفارشی ثبت نشده است.</div>}</div></section>
      </div>
    </div>
  );
}
