"use client";

import Link from "next/link";
import { KeyRound, LogOut, MapPin, Package, Phone, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Field";
import { formatDate, formatToman, toFa } from "@/lib/format";
import { logoutCustomerAction, requestCustomerOtpAction, verifyCustomerOtpAction } from "@/server/auth/customer-actions";
import type { CustomerSessionUser } from "@/server/auth/customer-session";
import type { Order } from "@/types/store";

export function AccountPage({ customer, orders }: { customer: CustomerSessionUser | null; orders: Order[] }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try { const result = await requestCustomerOtpAction({ phone }); if (!result.ok) return toast.error(result.message); setChallengeId(result.challengeId); toast.success("کد یک‌بارمصرف ارسال شد"); }
    finally { setBusy(false); }
  }
  async function verifyCode(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try { const result = await verifyCustomerOtpAction({ phone, challengeId, code }); if (!result.ok) return toast.error(result.message); toast.success("با موفقیت وارد شدید"); router.refresh(); }
    finally { setBusy(false); }
  }
  async function logout() { await logoutCustomerAction(); router.refresh(); }

  if (!customer) return (
    <div className="container-site flex min-h-[65vh] items-center justify-center py-16"><div className="w-full max-w-md rounded-3xl border border-border p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,.06)] sm:p-9"><span className="mx-auto grid size-16 place-items-center rounded-full bg-stone-100">{challengeId ? <KeyRound className="size-7" /> : <UserRound className="size-7" />}</span><h1 className="mt-5 text-2xl font-black">ورود امن به حساب</h1><p className="mt-2 text-xs leading-6 text-muted">{challengeId ? "کد ۶ رقمی ارسال‌شده را وارد کنید." : "شماره موبایل خرید را وارد کنید تا کد یک‌بارمصرف دریافت کنید."}</p>{challengeId ? <form onSubmit={verifyCode} className="mt-6"><Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" dir="ltr" placeholder="کد ۶ رقمی" required /><Button type="submit" className="mt-3 w-full" disabled={busy || code.length !== 6}>تأیید و ورود</Button><button type="button" className="mt-4 text-[10px] font-bold text-muted" onClick={() => { setChallengeId(""); setCode(""); }}>تغییر شماره موبایل</button></form> : <form onSubmit={requestCode} className="mt-6"><Input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" dir="ltr" placeholder="09123456789" required /><Button type="submit" className="mt-3 w-full" disabled={busy}>دریافت کد ورود</Button></form>}<p className="mt-5 text-[9px] leading-5 text-muted">کد ورود پنج دقیقه اعتبار دارد و فقط یک‌بار قابل استفاده است.</p></div></div>
  );

  const totalSpent = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);
  return (
    <div className="container-site py-10 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-ink text-sm font-black text-white">{customer.name.slice(0, 2)}</span><div><p className="text-[10px] text-muted">خوش آمدید</p><h1 className="text-xl font-black">{customer.name}</h1></div></div><Button variant="outline" size="sm" onClick={logout}><LogOut className="size-4" /> خروج امن</Button></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-border p-5"><h2 className="text-xs font-black">اطلاعات حساب</h2><div className="mt-4 grid gap-3 text-[11px] text-muted"><p className="flex items-center gap-2"><Phone className="size-4" /><span dir="ltr">{customer.phone}</span></p><p className="flex items-center gap-2"><MapPin className="size-4" />{customer.city || "ثبت نشده"}</p><p className="flex items-center gap-2"><Package className="size-4" />{toFa(orders.length)} سفارش · {formatToman(totalSpent)}</p></div></aside>
        <section><h2 className="text-sm font-black">سفارش‌های من</h2><div className="mt-4 grid gap-3">{orders.length ? orders.map((order) => <article key={order.id} className="rounded-2xl border border-border p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-xs" dir="ltr">{order.id}</strong><p className="mt-1 text-[9px] text-muted">{formatDate(order.createdAt)} · {toFa(order.items.reduce((sum, item) => sum + item.quantity, 0))} قلم</p></div><div className="text-left"><strong className="text-xs">{formatToman(order.total)}</strong><p className="mt-1 text-[9px] text-muted">{order.shippingMethod}</p></div></div><Link href={`/tracking?order=${encodeURIComponent(order.id)}`} className="mt-4 inline-flex rounded-lg bg-stone-100 px-3 py-2 text-[10px] font-bold hover:bg-stone-200">مشاهده وضعیت سفارش</Link></article>) : <div className="rounded-2xl border border-dashed border-border py-14 text-center text-xs text-muted">هنوز سفارشی ثبت نشده است.</div>}</div></section>
      </div>
    </div>
  );
}
