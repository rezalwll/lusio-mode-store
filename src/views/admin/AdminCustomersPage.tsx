"use client";

import { Edit3, Eye, Search, ShoppingBag, UserCheck, UserRound, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { formatToman, toFa } from "@/lib/format";
import { saveCustomerAction } from "@/server/actions/customers";
import type { Customer, Order } from "@/types/store";

const statusLabels = { pending: "در انتظار", processing: "در حال پردازش", shipped: "ارسال‌شده", delivered: "تحویل‌شده", cancelled: "لغوشده" } as const;

export function AdminCustomersPage({ customers, orders }: { customers: Customer[]; orders: Order[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "" });
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((item) => !term || `${item.name} ${item.phone} ${item.email} ${item.city}`.toLowerCase().includes(term));
  }, [customers, query]);
  const totalValue = customers.reduce((sum, item) => sum + item.totalSpent, 0);
  const customerOrders = viewing ? orders.filter((order) => order.customerId === viewing.id) : [];

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({ name: customer.name, phone: customer.phone, email: customer.email, city: customer.city });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing || !form.name.trim() || !/^09\d{9}$/.test(form.phone)) return toast.error("نام و شماره موبایل معتبر لازم است");
    const result = await saveCustomerAction({ ...editing, ...form });
    if (!result.ok) return toast.error(result.message);
    setEditing(null);
    toast.success("اطلاعات مشتری ذخیره شد");
    router.refresh();
  }

  async function toggle(customer: Customer) {
    const result = await saveCustomerAction({ ...customer, active: !customer.active });
    if (!result.ok) return toast.error(result.message);
    toast.success(customer.active ? "حساب مشتری مسدود شد" : "حساب مشتری فعال شد");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div><p className="text-[10px] font-bold text-brand">باشگاه مشتریان</p><h1 className="mt-1 text-2xl font-black">مدیریت مشتریان</h1><p className="mt-1.5 text-[10px] text-muted">اطلاعات حساب، سابقه سفارش و ارزش خرید هر مشتری را مدیریت کنید.</p></div>
      <section className="grid gap-3 sm:grid-cols-3">
        {[[UserRound, "کل مشتریان", toFa(customers.length), "bg-blue-50 text-blue-700"], [UserCheck, "مشتریان فعال", toFa(customers.filter((item) => item.active).length), "bg-emerald-50 text-emerald-700"], [UserX, "ارزش کل خرید", formatToman(totalValue), "bg-violet-50 text-violet-700"]].map(([Icon, label, value, tone]) => { const I = Icon as typeof UserRound; return <article key={String(label)} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><I className="size-5" /></span><div><strong className="text-sm font-black">{String(value)}</strong><p className="mt-1 text-[9px] text-muted">{String(label)}</p></div></article>; })}
      </section>
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        <div className="border-b border-border p-4"><div className="relative max-w-sm"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، موبایل، ایمیل یا شهر..." className="bg-stone-50 pr-10" /></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="px-5 py-3 font-medium">مشتری</th><th className="px-3 py-3 font-medium">ارتباط</th><th className="px-3 py-3 font-medium">شهر</th><th className="px-3 py-3 font-medium">سفارش‌ها</th><th className="px-3 py-3 font-medium">مجموع خرید</th><th className="px-3 py-3 font-medium">وضعیت</th><th className="px-5 py-3 font-medium">عملیات</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((customer) => <tr key={customer.id} className="hover:bg-stone-50/70"><td className="px-5 py-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-ink text-[9px] font-black text-white">{customer.name.slice(0, 2)}</span><div><strong className="text-[10px]">{customer.name}</strong><span className="mt-0.5 block text-[8px] text-muted">عضویت {customer.joinedAt}</span></div></div></td><td className="px-3 py-3"><span className="block" dir="ltr">{customer.phone}</span><span className="mt-1 block text-[8px] text-muted" dir="ltr">{customer.email || "—"}</span></td><td className="px-3 py-3">{customer.city || "—"}</td><td className="px-3 py-3 font-bold">{toFa(customer.ordersCount)}</td><td className="px-3 py-3 font-bold">{formatToman(customer.totalSpent)}</td><td className="px-3 py-3"><button type="button" onClick={() => toggle(customer)} className={`rounded-full px-2.5 py-1 font-bold ${customer.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{customer.active ? "فعال" : "مسدود"}</button></td><td className="px-5 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" onClick={() => setViewing(customer)} aria-label="مشاهده پرونده"><Eye className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(customer)} aria-label="ویرایش مشتری"><Edit3 className="size-3.5" /></Button></div></td></tr>)}</tbody></table></div>
        {!filtered.length && <div className="p-12 text-center text-[10px] text-muted">مشتری‌ای پیدا نشد.</div>}
        <div className="border-t border-border px-5 py-3 text-[9px] text-muted">نمایش {toFa(filtered.length)} مشتری</div>
      </section>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={`پرونده ${viewing?.name ?? "مشتری"}`}>
        <div className="space-y-5 p-5 sm:p-6">
          {viewing && <div className="grid gap-3 rounded-xl bg-stone-50 p-4 text-[9px] sm:grid-cols-2"><p><span className="block text-muted">موبایل</span><strong className="mt-1 block" dir="ltr">{viewing.phone}</strong></p><p><span className="block text-muted">شهر</span><strong className="mt-1 block">{viewing.city || "ثبت نشده"}</strong></p><p><span className="block text-muted">تعداد سفارش</span><strong className="mt-1 block">{toFa(viewing.ordersCount)}</strong></p><p><span className="block text-muted">ارزش خرید</span><strong className="mt-1 block">{formatToman(viewing.totalSpent)}</strong></p></div>}
          <div><div className="mb-3 flex items-center gap-2"><ShoppingBag className="size-4" /><h3 className="text-[10px] font-black">تاریخچه سفارش‌ها</h3></div>{customerOrders.length ? <div className="space-y-2">{customerOrders.map((order) => <article key={order.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-[9px]"><strong dir="ltr">{order.id}</strong><span className="text-muted">{new Intl.DateTimeFormat("fa-IR").format(new Date(order.createdAt))}</span><span className="rounded-full bg-stone-100 px-2 py-1 font-bold">{statusLabels[order.status]}</span><strong className="mr-auto">{formatToman(order.total)}</strong></article>)}</div> : <p className="rounded-xl border border-dashed border-border py-8 text-center text-[9px] text-muted">سفارشی برای این مشتری ثبت نشده است.</p>}</div>
        </div>
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="ویرایش اطلاعات مشتری"><form onSubmit={submit}><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><Field label="نام و نام خانوادگی"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="شماره موبایل"><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} dir="ltr" /></Field><Field label="ایمیل"><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} dir="ltr" /></Field><Field label="شهر"><Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field></div><div className="flex justify-end gap-2 border-t border-border p-4"><Button type="button" variant="outline" onClick={() => setEditing(null)}>انصراف</Button><Button type="submit">ذخیره تغییرات</Button></div></form></Modal>
    </div>
  );
}
