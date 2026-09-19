import { Banknote, Download, Eye, FileText, PackageCheck, Printer, Search, ShoppingBag, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { orderStatusClass, orderStatusLabels, paymentStatusLabels } from "@/lib/admin";
import { formatDate, formatToman, toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { Order, OrderStatus, PaymentStatus } from "@/types/store";

const statuses = Object.entries(orderStatusLabels) as [OrderStatus, string][];
const paymentStatuses = Object.entries(paymentStatusLabels) as [PaymentStatus, string][];
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { pending: "processing", processing: "shipped", shipped: "delivered" };

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

export function AdminOrdersPage() {
  const orders = useStore((state) => state.orders);
  const updateOrder = useStore((state) => state.updateOrder);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => (!term || `${order.id} ${order.customerName} ${order.phone} ${order.trackingCode || ""}`.toLowerCase().includes(term)) && (status === "all" || order.status === status));
  }, [orders, query, status]);
  const revenue = orders.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.total, 0);
  const active = orders.filter((item) => ["pending", "processing", "shipped"].includes(item.status)).length;

  function changeStatus(id: string, value: OrderStatus) {
    updateOrder(id, { status: value });
    setSelected((current) => current?.id === id ? { ...current, status: value } : current);
    toast.success("وضعیت سفارش به‌روز شد");
  }

  function saveDetails() {
    if (!selected) return;
    updateOrder(selected.id, { trackingCode: selected.trackingCode?.trim(), internalNote: selected.internalNote?.trim(), paymentStatus: selected.paymentStatus });
    toast.success("اطلاعات اجرایی سفارش ذخیره شد");
  }

  function exportCsv() {
    const csv = [
      ["شماره سفارش", "مشتری", "موبایل", "شهر", "تاریخ", "مبلغ", "وضعیت", "پرداخت", "کد رهگیری"],
      ...filtered.map((order) => [order.id, order.customerName, order.phone, order.city, order.createdAt, order.total, orderStatusLabels[order.status], paymentStatusLabels[order.paymentStatus], order.trackingCode || ""]),
    ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `eleven-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  }

  function printInvoice(order: Order) {
    const popup = window.open("", "_blank", "width=820,height=900");
    if (!popup) return toast.error("اجازه بازشدن پنجره چاپ را فعال کنید");
    const rows = order.items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(`${item.size} / ${item.color}`)}</td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(formatToman(item.price * item.quantity))}</td></tr>`).join("");
    popup.document.write(`<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>${escapeHtml(order.id)}</title><style>body{font-family:Tahoma,sans-serif;padding:40px;color:#181818}header{display:flex;justify-content:space-between;border-bottom:2px solid #181818;padding-bottom:20px}h1{font-size:22px}small{color:#777}section{margin:24px 0;line-height:2}table{width:100%;border-collapse:collapse}th,td{text-align:right;border-bottom:1px solid #ddd;padding:12px;font-size:12px}.total{font-size:18px;font-weight:bold;text-align:left;margin-top:24px}@media print{button{display:none}}</style></head><body><header><div><h1>فاکتور فروش الون استایل</h1><small>${escapeHtml(order.id)} · ${escapeHtml(formatDate(order.createdAt))}</small></div><button onclick="window.print()">چاپ فاکتور</button></header><section><b>${escapeHtml(order.customerName)}</b><br>${escapeHtml(order.phone)}<br>${escapeHtml(`${order.city}، ${order.address}`)}<br>کد پستی: ${escapeHtml(order.postalCode)}</section><table><thead><tr><th>محصول</th><th>انتخاب</th><th>تعداد</th><th>مبلغ</th></tr></thead><tbody>${rows}</tbody></table><p class="total">جمع کل: ${escapeHtml(formatToman(order.total))}</p></body></html>`);
    popup.document.close();
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold text-brand">فروش و ارسال</p><h1 className="mt-1 text-2xl font-black">مدیریت سفارش‌ها</h1><p className="mt-1.5 text-[10px] text-muted">از ثبت پرداخت تا رهگیری مرسوله و فاکتور را کنترل کنید.</p></div><Button variant="outline" onClick={exportCsv}><Download className="size-4" />خروجی سفارش‌ها</Button></div>
      <section className="grid gap-3 sm:grid-cols-3">{[[ShoppingBag, "کل سفارش‌ها", `${toFa(orders.length)} سفارش`, "bg-blue-50 text-blue-700"], [Truck, "در جریان", `${toFa(active)} سفارش`, "bg-amber-50 text-amber-700"], [Banknote, "فروش ثبت‌شده", formatToman(revenue), "bg-emerald-50 text-emerald-700"]].map(([Icon, label, value, tone]) => { const I = Icon as typeof ShoppingBag; return <article key={String(label)} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><I className="size-5" /></span><div><strong className="text-sm font-black">{String(value)}</strong><p className="mt-1 text-[9px] text-muted">{String(label)}</p></div></article>; })}</section>
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white"><div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="شماره سفارش، مشتری، موبایل یا رهگیری..." className="bg-stone-50 pr-10" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-[10px] font-bold outline-none"><option value="all">همه وضعیت‌ها</option>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="px-5 py-3 font-medium">سفارش</th><th className="px-3 py-3 font-medium">مشتری</th><th className="px-3 py-3 font-medium">تاریخ</th><th className="px-3 py-3 font-medium">اقلام</th><th className="px-3 py-3 font-medium">مبلغ</th><th className="px-3 py-3 font-medium">رهگیری</th><th className="px-3 py-3 font-medium">وضعیت</th><th className="px-5 py-3 font-medium">جزئیات</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((order) => <tr key={order.id} className="hover:bg-stone-50/70"><td className="px-5 py-3.5 font-black" dir="ltr">{order.id}</td><td className="px-3 py-3.5"><strong className="block text-[10px]">{order.customerName}</strong><span className="text-[8px] text-muted" dir="ltr">{order.phone}</span></td><td className="px-3 py-3.5 text-muted">{formatDate(order.createdAt)}</td><td className="px-3 py-3.5">{toFa(order.items.reduce((sum, item) => sum + item.quantity, 0))} قلم</td><td className="px-3 py-3.5 font-bold">{formatToman(order.total)}</td><td className="px-3 py-3.5 text-[8px]" dir="ltr">{order.trackingCode || "—"}</td><td className="px-3 py-3.5"><select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value as OrderStatus)} className={`h-8 rounded-full border-0 px-2 text-[8px] font-bold outline-none ring-1 ring-inset ${orderStatusClass[order.status]}`}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="px-5 py-3.5"><Button size="sm" variant="ghost" onClick={() => setSelected({ ...order })} className="h-8 text-[9px]"><Eye className="size-3.5" />مشاهده</Button></td></tr>)}</tbody></table></div>
        {!filtered.length && <p className="py-16 text-center text-xs text-muted">سفارشی پیدا نشد.</p>}<div className="border-t border-border px-5 py-3 text-[9px] text-muted">نمایش {toFa(filtered.length)} سفارش</div>
      </section>
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`جزئیات سفارش ${selected?.id || ""}`} description={selected ? formatDate(selected.createdAt) : ""} className="max-w-2xl">
        {selected && <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-3 rounded-xl bg-stone-50 p-4 text-[10px] sm:grid-cols-2"><div><span className="text-muted">مشتری</span><strong className="mt-1 block text-xs">{selected.customerName}</strong><span className="mt-1 block text-muted" dir="ltr">{selected.phone}</span></div><div><span className="text-muted">نشانی ارسال</span><p className="mt-1 leading-6">{selected.city}، {selected.address}<br />کد پستی: {selected.postalCode}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-2 block text-[10px] font-bold">وضعیت سفارش</span><select value={selected.status} onChange={(event) => changeStatus(selected.id, event.target.value as OrderStatus)} className="h-11 w-full rounded-xl border border-border px-3 text-xs outline-none">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span className="mb-2 block text-[10px] font-bold">وضعیت پرداخت</span><select value={selected.paymentStatus} onChange={(event) => setSelected({ ...selected, paymentStatus: event.target.value as PaymentStatus })} className="h-11 w-full rounded-xl border border-border px-3 text-xs outline-none">{paymentStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
          <div><h3 className="text-[10px] font-black">اقلام سفارش</h3><ul className="mt-3 divide-y divide-border rounded-xl border border-border px-4">{selected.items.map((item, index) => <li key={`${item.productId}-${index}`} className="flex justify-between gap-4 py-3 text-[10px]"><span>{item.name} × {toFa(item.quantity)}<small className="mt-1 block text-muted">{item.size} / {item.color}</small></span><strong className="shrink-0">{formatToman(item.price * item.quantity)}</strong></li>)}</ul></div>
          <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-2 block text-[10px] font-bold">کد رهگیری مرسوله</span><Input value={selected.trackingCode || ""} onChange={(event) => setSelected({ ...selected, trackingCode: event.target.value })} dir="ltr" placeholder="POST-..." /></label><label className="sm:col-span-2"><span className="mb-2 block text-[10px] font-bold">یادداشت داخلی مدیر</span><Textarea value={selected.internalNote || ""} onChange={(event) => setSelected({ ...selected, internalNote: event.target.value })} rows={3} placeholder="این یادداشت به مشتری نمایش داده نمی‌شود..." /></label></div>
          <dl className="divide-y divide-border rounded-xl border border-border px-4 text-[10px]"><div className="flex justify-between py-3"><dt className="text-muted">روش ارسال</dt><dd className="font-bold">{selected.shippingMethod}</dd></div><div className="flex justify-between py-3 text-xs"><dt className="font-black">مبلغ کل</dt><dd className="font-black">{formatToman(selected.total)}</dd></div></dl>
          <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => printInvoice(selected)}><Printer className="size-4" />چاپ فاکتور</Button><Button variant="outline" onClick={saveDetails}><FileText className="size-4" />ذخیره رهگیری و یادداشت</Button></div>
          <Button className="w-full" onClick={() => nextStatus[selected.status] && changeStatus(selected.id, nextStatus[selected.status]!)} disabled={!nextStatus[selected.status]}><PackageCheck className="size-4" />ثبت مرحله بعد سفارش</Button>
        </div>}
      </Modal>
    </div>
  );
}
