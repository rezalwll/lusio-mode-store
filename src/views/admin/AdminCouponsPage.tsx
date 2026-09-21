"use client";

import { Edit3, Percent, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { formatToman, toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { Coupon } from "@/types/store";

const empty = { code: "", type: "percent" as Coupon["type"], value: "", minOrder: "0", usageLimit: "100", expiresAt: "", active: true };

export function AdminCouponsPage() {
  const coupons = useStore((state) => state.coupons);
  const saveCoupon = useStore((state) => state.saveCoupon);
  const deleteCoupon = useStore((state) => state.deleteCoupon);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  function start(coupon?: Coupon) { setEditing(coupon || null); setForm(coupon ? { code: coupon.code, type: coupon.type, value: String(coupon.value), minOrder: String(coupon.minOrder), usageLimit: String(coupon.usageLimit), expiresAt: coupon.expiresAt, active: coupon.active } : empty); setOpen(true); }
  function submit(event: FormEvent) { event.preventDefault(); if (!form.code.trim() || !Number(form.value) || !form.expiresAt) { toast.error("کد، مقدار تخفیف و تاریخ پایان لازم است"); return; } saveCoupon({ id: editing?.id ?? Math.max(0, ...coupons.map((item) => item.id)) + 1, code: form.code.trim().toUpperCase(), type: form.type, value: Number(form.value), minOrder: Number(form.minOrder), usageLimit: Number(form.usageLimit), used: editing?.used ?? 0, expiresAt: form.expiresAt, active: form.active }); setOpen(false); toast.success("کد تخفیف ذخیره شد"); }
  function remove(coupon: Coupon) { if (window.confirm(`کد ${coupon.code} حذف شود؟`)) { deleteCoupon(coupon.id); toast.success("کد تخفیف حذف شد"); } }
  return (
    <div className="mx-auto max-w-[1500px] space-y-6"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold text-brand">بازاریابی و فروش</p><h1 className="mt-1 text-2xl font-black">کدهای تخفیف</h1><p className="mt-1.5 text-[10px] text-muted">کمپین‌های تخفیف را بسازید و میزان استفاده را کنترل کنید.</p></div><Button onClick={() => start()}><Plus className="size-4" />کد جدید</Button></div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{coupons.map((coupon) => { const exhausted = coupon.used >= coupon.usageLimit || new Date(coupon.expiresAt) < new Date(); return <article key={coupon.id} className={`rounded-2xl border border-black/5 bg-white p-5 ${!coupon.active || exhausted ? "opacity-60" : ""}`}><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-brand"><Percent className="size-5" /></span><span className={`rounded-full px-2 py-1 text-[8px] font-bold ${coupon.active && !exhausted ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-muted"}`}>{coupon.active && !exhausted ? "فعال" : "غیرفعال"}</span></div><h2 className="mt-5 text-lg font-black tracking-wider" dir="ltr">{coupon.code}</h2><p className="mt-1 text-xs font-bold text-brand">{coupon.type === "percent" ? `${toFa(coupon.value)}٪ تخفیف` : formatToman(coupon.value)}</p><dl className="mt-5 space-y-2 border-t border-border pt-4 text-[9px]"><div className="flex justify-between"><dt className="text-muted">حداقل سفارش</dt><dd>{formatToman(coupon.minOrder)}</dd></div><div className="flex justify-between"><dt className="text-muted">استفاده</dt><dd>{toFa(coupon.used)} از {toFa(coupon.usageLimit)}</dd></div><div className="flex justify-between"><dt className="text-muted">پایان اعتبار</dt><dd dir="ltr">{coupon.expiresAt}</dd></div></dl><div className="mt-4 flex gap-1"><Button variant="ghost" size="sm" className="h-8" onClick={() => start(coupon)}><Edit3 className="size-3.5" />ویرایش</Button><Button variant="ghost" size="icon" className="size-8 text-rose-600" onClick={() => remove(coupon)}><Trash2 className="size-3.5" /></Button></div></article>; })}</section>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "ویرایش کد تخفیف" : "ساخت کد تخفیف"}><form onSubmit={submit}><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><Field label="کد تخفیف"><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} dir="ltr" className="uppercase" /></Field><Field label="نوع تخفیف"><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Coupon["type"] })} className="h-11 w-full rounded-xl border border-border px-3 text-xs outline-none"><option value="percent">درصدی</option><option value="fixed">مبلغ ثابت</option></select></Field><Field label={form.type === "percent" ? "درصد تخفیف" : "مبلغ تخفیف"}><Input value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} inputMode="numeric" dir="ltr" /></Field><Field label="حداقل مبلغ سفارش"><Input value={form.minOrder} onChange={(event) => setForm({ ...form, minOrder: event.target.value })} inputMode="numeric" dir="ltr" /></Field><Field label="سقف استفاده"><Input value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} inputMode="numeric" dir="ltr" /></Field><Field label="تاریخ پایان"><Input value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} type="date" dir="ltr" /></Field><label className="flex items-center justify-between rounded-xl border border-border p-3 text-[10px] font-bold sm:col-span-2">فعال باشد<input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="size-4 accent-ink" /></label></div><div className="flex justify-end gap-2 border-t border-border p-4"><Button type="button" variant="outline" onClick={() => setOpen(false)}>انصراف</Button><Button type="submit">ذخیره کد</Button></div></form></Modal>
    </div>
  );
}
