"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, Copy, Download, Edit3, Package, PackagePlus, Search, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { productPlaceholderUrl } from "@/lib/assets";
import { formatToman, toFa } from "@/lib/format";
import { archiveProductAction, bulkProductStatusAction, saveProductAction } from "@/server/actions/catalog";
import type { Category, Product, ProductVariant } from "@/types/store";

const productSchema = z.object({
  name: z.string().min(3, "نام محصول کوتاه است"),
  sku: z.string().min(2, "شناسه محصول را وارد کنید"),
  category: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  price: z.string().regex(/^\d+$/, "قیمت معتبر نیست"),
  regularPrice: z.string().regex(/^\d+$/, "قیمت معتبر نیست"),
  stock: z.string().regex(/^\d+$/, "موجودی معتبر نیست"),
  colors: z.string(),
  sizes: z.string(),
  description: z.string().min(10, "توضیحات محصول کوتاه است"),
  status: z.enum(["published", "draft", "archived"]),
  featured: z.boolean(),
  metaTitle: z.string().max(70, "عنوان سئو بهتر است کمتر از ۷۰ کاراکتر باشد"),
  metaDescription: z.string().max(170, "توضیح سئو بهتر است کمتر از ۱۷۰ کاراکتر باشد"),
});
type ProductForm = z.infer<typeof productSchema>;

const emptyValues: ProductForm = {
  name: "",
  sku: "",
  category: "",
  price: "",
  regularPrice: "",
  stock: "0",
  colors: "مشکی, سفید",
  sizes: "M, L, XL, XXL",
  description: "",
  status: "published",
  featured: false,
  metaTitle: "",
  metaDescription: "",
};

const statusLabels = { published: "منتشرشده", draft: "پیش‌نویس", archived: "بایگانی" } as const;
const statusClasses = { published: "bg-emerald-50 text-emerald-700", draft: "bg-amber-50 text-amber-700", archived: "bg-stone-100 text-stone-600" } as const;

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-").replace(/^-|-$/g, "") || `product-${Date.now()}`;
}

function productStatus(product: Product): NonNullable<Product["status"]> {
  return product.status ?? (product.active ? "published" : "draft");
}

function splitList(value: string, fallback: string) {
  const values = value.split(",").map((item) => item.trim()).filter(Boolean);
  return values.length ? values : [fallback];
}

export function AdminProductsPage({ products, categories, initialQuery = "" }: { products: Product[]; categories: Category[]; initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm<ProductForm>({ resolver: zodResolver(productSchema), defaultValues: emptyValues });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) =>
      (!term || `${product.name} ${product.sku}`.toLowerCase().includes(term)) &&
      (category === "all" || product.category === category || product.categorySlugs.includes(category)),
    );
  }, [products, query, category]);
  const lowStock = products.filter((item) => item.active && item.stock > 0 && item.stock <= 5).length;
  const outOfStock = products.filter((item) => item.active && item.stock === 0).length;
  const selectedProducts = products.filter((item) => selected.includes(item.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((item) => selected.includes(item.id));

  function createProduct() {
    setEditing(null);
    setImages([]);
    setVariants([]);
    reset({ ...emptyValues, sku: `ELV-${String(products.length + 1).padStart(4, "0")}`, category: categories.find((item) => item.parent === 0)?.slug || "" });
    setOpen(true);
  }

  function editProduct(product: Product) {
    setEditing(product);
    setImages(product.images);
    setVariants(product.variants ?? []);
    reset({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      regularPrice: String(product.regularPrice),
      stock: String(product.stock),
      colors: product.colors.join(", "),
      sizes: product.sizes.join(", "),
      description: product.description,
      status: productStatus(product),
      featured: product.featured,
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
    });
    setOpen(true);
  }

  function generateVariants() {
    const sizes = splitList(getValues("sizes"), "فری‌سایز");
    const colors = splitList(getValues("colors"), "پیش‌فرض");
    const baseSku = getValues("sku") || "ELV";
    const previous = new Map(variants.map((item) => [`${item.size}-${item.color}`, item]));
    const rows = sizes.flatMap((size, sizeIndex) => colors.map((color, colorIndex) => {
      const old = previous.get(`${size}-${color}`);
      const suffix = `${String(sizeIndex + 1).padStart(2, "0")}${String(colorIndex + 1).padStart(2, "0")}`;
      return old ?? { id: `${Date.now()}-${sizeIndex}-${colorIndex}`, sku: `${baseSku}-${suffix}`, size, color, stock: 0 };
    }));
    setVariants(rows);
    toast.success(`${rows.length} واریانت آماده شد`);
  }

  function updateVariant(index: number, key: "sku" | "stock", value: string) {
    setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === "stock" ? Math.max(0, Number(value) || 0) : value } : item));
  }

  async function submit(values: ProductForm) {
    if (!images.length) return toast.error("حداقل یک تصویر آپلود یا اضافه کنید");
    const price = Number(values.price);
    const regularPrice = Number(values.regularPrice);
    if (regularPrice < price) return toast.error("قیمت اصلی نباید کمتر از قیمت فروش باشد");
    const sizes = splitList(values.sizes, "فری‌سایز");
    const colors = splitList(values.colors, "پیش‌فرض");
    const result = await saveProductAction({
      id: editing?.id,
      slug: editing?.slug ?? slugify(values.name),
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category,
      price,
      regularPrice,
      images,
      colors,
      sizes,
      stock: variants.length ? variants.reduce((sum, item) => sum + item.stock, 0) : Number(values.stock),
      status: values.status,
      featured: values.featured,
      description: values.description.trim(),
      variants,
      metaTitle: values.metaTitle.trim(),
      metaDescription: values.metaDescription.trim(),
    });
    if (!result.ok) return toast.error(result.message);
    setOpen(false);
    toast.success(editing ? "محصول ویرایش شد" : "محصول جدید ساخته شد");
    router.refresh();
  }

  async function remove(product: Product) {
    if (window.confirm(`محصول «${product.name}» حذف شود؟`)) {
      const result = await archiveProductAction(product.id);
      if (!result.ok) return toast.error(result.message);
      setSelected((items) => items.filter((id) => id !== product.id));
      toast.success("محصول بایگانی شد");
      router.refresh();
    }
  }

  async function duplicate(product: Product) {
    const suffix = Date.now().toString(36).toUpperCase();
    const result = await saveProductAction({
      slug: `${product.slug}-copy-${suffix.toLowerCase()}`,
      name: `${product.name} (کپی)`,
      sku: `${product.sku}-COPY-${suffix}`,
      category: product.category,
      price: product.price,
      regularPrice: product.regularPrice,
      images: product.images,
      colors: product.colors,
      sizes: product.sizes,
      stock: product.stock,
      featured: false,
      description: product.description,
      status: "draft",
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      variants: (product.variants ?? []).map((variant, index) => ({ ...variant, id: undefined, sku: `${product.sku}-COPY-${suffix}-${index + 1}` })),
    });
    if (!result.ok) return toast.error(result.message);
    toast.success("یک نسخه پیش‌نویس ساخته شد");
    router.refresh();
  }

  async function bulkStatus(status: NonNullable<Product["status"]>) {
    const result = await bulkProductStatusAction({ ids: selected, status });
    if (!result.ok) return toast.error(result.message);
    toast.success(`وضعیت ${toFa(selectedProducts.length)} محصول تغییر کرد`);
    setSelected([]);
    router.refresh();
  }

  async function bulkDelete() {
    if (!selected.length || !window.confirm(`${selected.length} محصول انتخاب‌شده بایگانی شوند؟`)) return;
    await bulkStatus("archived");
  }

  function exportCsv() {
    const rows = selectedProducts.length ? selectedProducts : filtered;
    const csv = [
      ["SKU", "نام", "دسته‌بندی", "قیمت", "موجودی", "وضعیت"],
      ...rows.map((product) => [product.sku, product.name, product.categoryName, product.price, product.stock, statusLabels[productStatus(product)]]),
    ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `eleven-products-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-bold text-brand">کاتالوگ فروشگاه</p><h1 className="mt-1 text-2xl font-black">مدیریت محصولات</h1><p className="mt-1.5 text-[10px] text-muted">تصویر، واریانت، موجودی، سئو و انتشار محصولات را یک‌جا کنترل کنید.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={exportCsv}><Download className="size-4" />خروجی CSV</Button><Button onClick={createProduct}><PackagePlus className="size-4" />افزودن محصول</Button></div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[[Package, "همه محصولات", products.length, "bg-blue-50 text-blue-700"], [TriangleAlert, "کم‌موجودی", lowStock, "bg-amber-50 text-amber-700"], [Package, "ناموجود", outOfStock, "bg-rose-50 text-rose-700"]].map(([Icon, label, value, tone]) => { const I = Icon as typeof Package; return <article key={String(label)} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><I className="size-5" /></span><div><strong className="text-lg font-black">{toFa(Number(value))}</strong><p className="text-[9px] text-muted">{String(label)}</p></div></article>; })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:max-w-sm"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو با نام یا شناسه..." className="bg-stone-50 pr-10" /></div>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-[10px] font-bold outline-none"><option value="all">همه دسته‌بندی‌ها</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select>
          </div>
          {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-xl bg-stone-50 p-2"><span className="px-2 text-[9px] font-bold">{toFa(selected.length)} انتخاب</span><Button size="sm" variant="outline" onClick={() => bulkStatus("published")}>انتشار</Button><Button size="sm" variant="outline" onClick={() => bulkStatus("draft")}>پیش‌نویس</Button><Button size="sm" variant="outline" onClick={() => bulkStatus("archived")}><Archive className="size-3" />بایگانی</Button><Button size="sm" variant="danger" onClick={bulkDelete}><Trash2 className="size-3" />حذف</Button></div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-[9px]">
            <thead className="bg-stone-50 text-muted"><tr><th className="w-12 px-4 py-3"><input type="checkbox" checked={allFilteredSelected} onChange={() => setSelected(allFilteredSelected ? selected.filter((id) => !filtered.some((item) => item.id === id)) : [...new Set([...selected, ...filtered.map((item) => item.id)])])} className="size-4 accent-ink" /></th><th className="px-3 py-3 font-medium">محصول</th><th className="px-3 py-3 font-medium">شناسه</th><th className="px-3 py-3 font-medium">قیمت</th><th className="px-3 py-3 font-medium">موجودی</th><th className="px-3 py-3 font-medium">وضعیت</th><th className="px-5 py-3 font-medium">عملیات</th></tr></thead>
            <tbody className="divide-y divide-border">{filtered.map((product) => { const status = productStatus(product); return <tr key={product.id} className={status === "archived" ? "opacity-55" : "hover:bg-stone-50/70"}><td className="px-4 py-3"><input type="checkbox" checked={selected.includes(product.id)} onChange={() => setSelected((items) => items.includes(product.id) ? items.filter((id) => id !== product.id) : [...items, product.id])} className="size-4 accent-ink" /></td><td className="px-3 py-3"><div className="flex min-w-[250px] items-center gap-3"><img src={product.images[0] || productPlaceholderUrl} alt="" className="h-14 w-11 rounded-lg object-cover" onError={(event) => { event.currentTarget.src = productPlaceholderUrl; }} /><div><strong className="line-clamp-1 max-w-[280px] text-[10px]">{product.name}</strong><span className="mt-1 block text-[8px] text-muted">{product.categoryName}{product.variants?.length ? ` · ${toFa(product.variants.length)} واریانت` : ""}</span></div></div></td><td className="px-3 py-3 font-medium" dir="ltr">{product.sku}</td><td className="px-3 py-3"><strong>{formatToman(product.price)}</strong>{product.regularPrice > product.price && <span className="mt-1 block text-[8px] text-muted line-through">{formatToman(product.regularPrice)}</span>}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 font-bold ${product.stock === 0 ? "bg-rose-50 text-rose-700" : product.stock <= 5 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{product.stock === 0 ? "ناموجود" : `${toFa(product.stock)} عدد`}</span></td><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 font-bold ${statusClasses[status]}`}>{statusLabels[status]}</span></td><td className="px-5 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" onClick={() => editProduct(product)} title="ویرایش"><Edit3 className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8" onClick={() => duplicate(product)} title="ساخت کپی"><Copy className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8 text-rose-600" onClick={() => remove(product)} title="حذف"><Trash2 className="size-3.5" /></Button></div></td></tr>; })}</tbody>
          </table>
        </div>
        {!filtered.length && <p className="py-16 text-center text-xs text-muted">محصولی پیدا نشد.</p>}
        <div className="border-t border-border px-5 py-3 text-[9px] text-muted">نمایش {toFa(filtered.length)} محصول از {toFa(products.length)}</div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "ویرایش محصول" : "افزودن محصول جدید"} description="اطلاعات کاتالوگ، رسانه، واریانت و انتشار" className="max-w-5xl">
        <form onSubmit={handleSubmit(submit)}>
          <div className="space-y-7 p-5 sm:p-6">
            <section><div className="mb-4 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-stone-100 text-[10px] font-black">۱</span><h3 className="text-xs font-black">اطلاعات پایه</h3></div><div className="grid gap-4 sm:grid-cols-2"><Field label="نام محصول" error={errors.name?.message} className="sm:col-span-2"><Input {...register("name")} /></Field><Field label="شناسه محصول" error={errors.sku?.message}><Input {...register("sku")} dir="ltr" /></Field><Field label="دسته‌بندی" error={errors.category?.message}><select {...register("category")} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-xs outline-none"><option value="">انتخاب کنید</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></Field><Field label="قیمت فروش (تومان)" error={errors.price?.message}><Input {...register("price")} inputMode="numeric" dir="ltr" /></Field><Field label="قیمت اصلی (تومان)" error={errors.regularPrice?.message}><Input {...register("regularPrice")} inputMode="numeric" dir="ltr" /></Field><Field label="توضیحات محصول" error={errors.description?.message} className="sm:col-span-2"><Textarea {...register("description")} rows={4} /></Field></div></section>

            <section className="border-t border-border pt-6"><div className="mb-4 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-stone-100 text-[10px] font-black">۲</span><div><h3 className="text-xs font-black">تصاویر محصول</h3><p className="mt-1 text-[8px] text-muted">آپلود مستقیم، بهینه‌سازی خودکار و تعیین تصویر کاور</p></div></div><ProductImageManager images={images} onChange={setImages} /></section>

            <section className="border-t border-border pt-6"><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-stone-100 text-[10px] font-black">۳</span><div><h3 className="text-xs font-black">تنوع و موجودی</h3><p className="mt-1 text-[8px] text-muted">برای هر ترکیب رنگ و سایز موجودی مستقل تعریف کنید.</p></div></div><Button type="button" size="sm" variant="outline" onClick={generateVariants}><Sparkles className="size-3.5" />ساخت واریانت‌ها</Button></div><div className="grid gap-4 sm:grid-cols-3"><Field label="سایزها (با ویرگول جدا کنید)" error={errors.sizes?.message}><Input {...register("sizes")} dir="ltr" /></Field><Field label="رنگ‌ها (با ویرگول جدا کنید)" error={errors.colors?.message}><Input {...register("colors")} /></Field><Field label="موجودی کل" error={errors.stock?.message} hint={variants.length ? "از مجموع موجودی واریانت‌ها محاسبه می‌شود" : "وقتی واریانت ندارید، این مقدار استفاده می‌شود"}><Input {...register("stock")} inputMode="numeric" dir="ltr" readOnly={variants.length > 0} value={variants.length ? String(variants.reduce((sum, item) => sum + item.stock, 0)) : undefined} /></Field></div>{variants.length > 0 && <div className="mt-4 overflow-x-auto border border-border"><table className="w-full min-w-[620px] text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="px-3 py-2">سایز</th><th className="px-3 py-2">رنگ</th><th className="px-3 py-2">SKU واریانت</th><th className="px-3 py-2">موجودی</th><th className="w-12 px-3 py-2" /></tr></thead><tbody className="divide-y divide-border">{variants.map((variant, index) => <tr key={variant.id}><td className="px-3 py-2 font-bold">{variant.size}</td><td className="px-3 py-2">{variant.color}</td><td className="px-3 py-2"><Input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} className="h-9" dir="ltr" /></td><td className="px-3 py-2"><Input value={variant.stock} onChange={(event) => updateVariant(index, "stock", event.target.value)} className="h-9 w-24" inputMode="numeric" dir="ltr" /></td><td className="px-3 py-2"><button type="button" onClick={() => setVariants((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="grid size-8 place-items-center text-rose-600"><Trash2 className="size-3.5" /></button></td></tr>)}</tbody></table></div>}</section>

            <section className="border-t border-border pt-6"><div className="mb-4 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-stone-100 text-[10px] font-black">۴</span><h3 className="text-xs font-black">انتشار و سئو</h3></div><div className="grid gap-4 sm:grid-cols-2"><Field label="وضعیت انتشار" error={errors.status?.message}><select {...register("status")} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-xs outline-none"><option value="published">منتشرشده در فروشگاه</option><option value="draft">پیش‌نویس</option><option value="archived">بایگانی</option></select></Field><label className="flex items-center justify-between rounded-xl border border-border p-3 text-[10px] font-bold">نمایش در انتخاب‌های ویژه<input type="checkbox" {...register("featured")} className="size-4 accent-ink" /></label><Field label="عنوان سئو" error={errors.metaTitle?.message} hint="اگر خالی باشد، نام محصول استفاده می‌شود"><Input {...register("metaTitle")} /></Field><Field label="توضیح سئو" error={errors.metaDescription?.message} hint="خلاصه‌ای کوتاه برای نتیجه‌های جستجو"><Textarea {...register("metaDescription")} rows={2} /></Field></div></section>
          </div>
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-white p-4"><Button type="button" variant="outline" onClick={() => setOpen(false)}>انصراف</Button><Button type="submit">ذخیره محصول</Button></div>
        </form>
      </Modal>
    </div>
  );
}
