"use client";

import { Boxes, CheckCircle2, Edit3, PackageX, Search, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { toFa } from "@/lib/format";
import { updateInventoryAction } from "@/server/actions/catalog";
import type { Product, ProductVariant } from "@/types/store";

type Filter = "all" | "low" | "out";

export function AdminInventoryPage({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [stock, setStock] = useState(0);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [saving, setSaving] = useState(false);
  const activeProducts = products.filter((product) => product.status !== "archived");
  const lowCount = activeProducts.filter((product) => product.stock > 0 && product.stock <= 5).length;
  const outCount = activeProducts.filter((product) => product.stock === 0).length;
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return activeProducts.filter((product) => {
      const matchesTerm = !term || `${product.name} ${product.sku} ${product.categoryName}`.toLowerCase().includes(term);
      const matchesFilter = filter === "all" || (filter === "low" ? product.stock > 0 && product.stock <= 5 : product.stock === 0);
      return matchesTerm && matchesFilter;
    });
  }, [activeProducts, filter, query]);

  function openEditor(product: Product) {
    setEditing(product);
    setStock(product.stock);
    setVariants((product.variants ?? []).map((variant) => ({ ...variant })));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    const result = await updateInventoryAction({
      productId: editing.id,
      stock: Math.max(0, stock),
      variants: variants.map((variant) => ({ id: variant.id, stock: Math.max(0, variant.stock) })),
    });
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    setEditing(null);
    toast.success("موجودی انبار به‌روزرسانی شد");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div><p className="text-[10px] font-bold text-brand">کنترل موجودی</p><h1 className="mt-1 text-2xl font-black">انبار فروشگاه</h1><p className="mt-1.5 text-[10px] text-muted">موجودی محصول‌ها و هر ترکیب رنگ و سایز را مستقیم مدیریت کنید.</p></div>
      <section className="grid gap-3 sm:grid-cols-3">
        {[[Boxes, "اقلام فعال", activeProducts.length, "bg-blue-50 text-blue-700"], [TriangleAlert, "کم‌موجودی", lowCount, "bg-amber-50 text-amber-700"], [PackageX, "ناموجود", outCount, "bg-rose-50 text-rose-700"]].map(([Icon, label, value, tone]) => { const I = Icon as typeof Boxes; return <article key={String(label)} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><I className="size-5" /></span><div><strong className="text-lg font-black">{toFa(Number(value))}</strong><p className="text-[9px] text-muted">{String(label)}</p></div></article>; })}
      </section>
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <label className="relative w-full max-w-sm"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، SKU یا دسته‌بندی..." className="bg-stone-50 pr-10" /></label>
          <div className="flex gap-1 rounded-xl bg-stone-100 p-1">{([['all', 'همه'], ['low', 'کم‌موجود'], ['out', 'ناموجود']] as const).map(([value, label]) => <button type="button" key={value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-[9px] font-bold transition ${filter === value ? "bg-white shadow-sm" : "text-muted"}`}>{label}</button>)}</div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="px-5 py-3 font-medium">محصول</th><th className="px-3 py-3 font-medium">SKU</th><th className="px-3 py-3 font-medium">واریانت</th><th className="px-3 py-3 font-medium">موجودی کل</th><th className="px-3 py-3 font-medium">وضعیت</th><th className="px-5 py-3 font-medium">عملیات</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((product) => <tr key={product.id} className="hover:bg-stone-50/70"><td className="px-5 py-3"><strong className="text-[10px]">{product.name}</strong><span className="mt-1 block text-[8px] text-muted">{product.categoryName}</span></td><td className="px-3 py-3" dir="ltr">{product.sku}</td><td className="px-3 py-3">{toFa(product.variants?.length ?? 0)}</td><td className="px-3 py-3 text-[11px] font-black">{toFa(product.stock)}</td><td className="px-3 py-3">{product.stock === 0 ? <span className="rounded-full bg-rose-50 px-2.5 py-1 font-bold text-rose-700">ناموجود</span> : product.stock <= 5 ? <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700">رو به اتمام</span> : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700"><CheckCircle2 className="size-3" />موجود</span>}</td><td className="px-5 py-3"><Button variant="ghost" size="sm" onClick={() => openEditor(product)}><Edit3 className="size-3.5" />ویرایش موجودی</Button></td></tr>)}</tbody></table></div>
        {!filtered.length && <div className="p-12 text-center text-[10px] text-muted">محصولی با این فیلتر پیدا نشد.</div>}
        <div className="border-t border-border px-5 py-3 text-[9px] text-muted">نمایش {toFa(filtered.length)} محصول</div>
      </section>
      <Modal open={Boolean(editing)} onClose={() => !saving && setEditing(null)} title={`موجودی ${editing?.name ?? ""}`}>
        <form onSubmit={save}>
          <div className="space-y-4 p-5 sm:p-6">
            {variants.length ? <><p className="text-[9px] leading-6 text-muted">موجودی کل از مجموع واریانت‌ها محاسبه می‌شود.</p><div className="overflow-hidden rounded-xl border border-border"><table className="w-full text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="p-3 font-medium">رنگ / سایز</th><th className="p-3 font-medium">SKU</th><th className="p-3 font-medium">موجودی</th></tr></thead><tbody className="divide-y divide-border">{variants.map((variant, index) => <tr key={variant.id}><td className="p-3 font-bold">{variant.color} / {variant.size}</td><td className="p-3" dir="ltr">{variant.sku}</td><td className="p-3"><Input type="number" min={0} max={1_000_000} value={variant.stock} onChange={(event) => setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, stock: Math.max(0, Number(event.target.value) || 0) } : item))} className="h-9 w-28" /></td></tr>)}</tbody></table></div><div className="rounded-xl bg-stone-50 p-3 text-[10px] font-bold">موجودی کل: {toFa(variants.reduce((sum, variant) => sum + variant.stock, 0))}</div></> : <label className="block text-[9px] font-bold">موجودی کل<Input type="number" min={0} max={1_000_000} value={stock} onChange={(event) => setStock(Math.max(0, Number(event.target.value) || 0))} className="mt-2" /></label>}
          </div>
          <div className="flex justify-end gap-2 border-t border-border p-4"><Button type="button" variant="outline" disabled={saving} onClick={() => setEditing(null)}>انصراف</Button><Button type="submit" disabled={saving}>{saving ? "در حال ذخیره..." : "ذخیره موجودی"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
