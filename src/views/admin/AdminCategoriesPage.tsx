"use client";

import { Edit3, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { productPlaceholderUrl } from "@/lib/assets";
import { toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { Category } from "@/types/store";

const empty = { name: "", slug: "", description: "", image: "", active: true };

export function AdminCategoriesPage() {
  const categories = useStore((state) => state.categories);
  const products = useStore((state) => state.products);
  const saveCategory = useStore((state) => state.saveCategory);
  const deleteCategory = useStore((state) => state.deleteCategory);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  function start(category?: Category) { setEditing(category || null); setForm(category ? { name: category.name, slug: category.slug, description: category.description, image: category.image, active: category.active } : empty); setOpen(true); }
  function submit(event: FormEvent) { event.preventDefault(); if (!form.name.trim() || !form.slug.trim()) { toast.error("نام و نامک دسته‌بندی الزامی است"); return; } saveCategory({ id: editing?.id ?? Math.max(0, ...categories.map((item) => item.id)) + 1, parent: editing?.parent ?? 0, ...form, slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-") }); setOpen(false); toast.success("دسته‌بندی ذخیره شد"); }
  function remove(category: Category) { const count = products.filter((item) => item.category === category.slug || item.categorySlugs.includes(category.slug)).length; if (count > 0) { toast.error(`این دسته‌بندی ${toFa(count)} محصول دارد و قابل حذف نیست`); return; } if (window.confirm(`دسته‌بندی «${category.name}» حذف شود؟`)) deleteCategory(category.id); }
  return (
    <div className="mx-auto max-w-[1500px] space-y-6"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold text-brand">ساختار کاتالوگ</p><h1 className="mt-1 text-2xl font-black">دسته‌بندی‌ها</h1><p className="mt-1.5 text-[10px] text-muted">دسته‌های قابل نمایش در فروشگاه را سازمان‌دهی کنید.</p></div><Button onClick={() => start()}><Plus className="size-4" />دسته جدید</Button></div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{categories.map((category) => { const count = products.filter((item) => item.category === category.slug || item.categorySlugs.includes(category.slug)).length; return <article key={category.id} className={`flex gap-4 rounded-2xl border border-black/5 bg-white p-4 ${!category.active ? "opacity-55" : ""}`}><img src={category.image || productPlaceholderUrl} alt="" className="size-20 shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h2 className="line-clamp-1 text-xs font-black">{category.name}</h2><p className="mt-1 text-[8px] text-muted" dir="ltr">/{category.slug}</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-bold ${category.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-muted"}`}>{category.active ? "فعال" : "مخفی"}</span></div><p className="mt-3 text-[9px] text-muted">{toFa(count)} محصول</p><div className="mt-3 flex gap-1"><Button variant="ghost" size="sm" className="h-8" onClick={() => start(category)}><Edit3 className="size-3.5" />ویرایش</Button><Button variant="ghost" size="icon" className="size-8 text-rose-600" onClick={() => remove(category)}><Trash2 className="size-3.5" /></Button></div></div></article>; })}</section>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}><form onSubmit={submit}><div className="grid gap-4 p-5 sm:p-6"><Field label="نام دسته‌بندی"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="نامک انگلیسی" hint="برای آدرس صفحه استفاده می‌شود"><Input value={form.slug} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, slug: event.target.value })} dir="ltr" /></Field><Field label="نشانی تصویر"><Input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} dir="ltr" /></Field><Field label="توضیحات"><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} /></Field><label className="flex items-center justify-between rounded-xl border border-border p-3 text-[10px] font-bold">نمایش در فروشگاه<input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="size-4 accent-ink" /></label></div><div className="flex justify-end gap-2 border-t border-border p-4"><Button type="button" variant="outline" onClick={() => setOpen(false)}>انصراف</Button><Button type="submit">ذخیره</Button></div></form></Modal>
    </div>
  );
}
