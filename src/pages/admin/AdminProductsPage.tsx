import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Package, PackagePlus, Search, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { productPlaceholderUrl } from "@/lib/assets";
import { formatToman, toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { Product } from "@/types/store";

const productSchema = z.object({
  name: z.string().min(3, "نام محصول کوتاه است"),
  sku: z.string().min(2, "شناسه محصول را وارد کنید"),
  category: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  price: z.string().regex(/^\d+$/, "قیمت معتبر نیست"),
  regularPrice: z.string().regex(/^\d+$/, "قیمت معتبر نیست"),
  stock: z.string().regex(/^\d+$/, "موجودی معتبر نیست"),
  images: z.string().min(4, "حداقل یک تصویر وارد کنید"),
  colors: z.string(),
  sizes: z.string(),
  description: z.string().min(10, "توضیحات محصول کوتاه است"),
  active: z.boolean(),
  featured: z.boolean(),
});
type ProductForm = z.infer<typeof productSchema>;

const emptyValues: ProductForm = { name: "", sku: "", category: "", price: "", regularPrice: "", stock: "", images: "", colors: "مشکی, سفید", sizes: "M, L, XL, XXL", description: "", active: true, featured: false };

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-").replace(/^-|-$/g, "") || `product-${Date.now()}`;
}

export function AdminProductsPage() {
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const saveProduct = useStore((state) => state.saveProduct);
  const deleteProduct = useStore((state) => state.deleteProduct);
  const toggleProduct = useStore((state) => state.toggleProduct);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({ resolver: zodResolver(productSchema), defaultValues: emptyValues });

  const filtered = useMemo(() => { const term = query.trim().toLowerCase(); return products.filter((product) => (!term || `${product.name} ${product.sku}`.toLowerCase().includes(term)) && (category === "all" || product.category === category || product.categorySlugs.includes(category))); }, [products, query, category]);
  const lowStock = products.filter((item) => item.active && item.stock > 0 && item.stock <= 5).length;
  const outOfStock = products.filter((item) => item.active && item.stock === 0).length;

  function createProduct() { setEditing(null); reset({ ...emptyValues, sku: `ELV-${String(products.length + 1).padStart(4, "0")}`, category: categories.find((item) => item.parent === 0)?.slug || "" }); setOpen(true); }
  function editProduct(product: Product) { setEditing(product); reset({ name: product.name, sku: product.sku, category: product.category, price: String(product.price), regularPrice: String(product.regularPrice), stock: String(product.stock), images: product.images.join("\n"), colors: product.colors.join(", "), sizes: product.sizes.join(", "), description: product.description, active: product.active, featured: product.featured }); setOpen(true); }
  function submit(values: ProductForm) {
    const selectedCategory = categories.find((item) => item.slug === values.category);
    const price = Number(values.price); const regularPrice = Number(values.regularPrice);
    if (regularPrice < price) { toast.error("قیمت اصلی نباید کمتر از قیمت فروش باشد"); return; }
    const product: Product = { id: editing?.id ?? Math.max(0, ...products.map((item) => item.id)) + 1, slug: editing?.slug ?? slugify(values.name), name: values.name.trim(), sku: values.sku.trim(), category: values.category, categoryName: selectedCategory?.name || "بدون دسته‌بندی", categorySlugs: [values.category], price, regularPrice, onSale: regularPrice > price, images: values.images.split(/\n|,/).map((item) => item.trim()).filter(Boolean), colors: values.colors.split(",").map((item) => item.trim()).filter(Boolean), sizes: values.sizes.split(",").map((item) => item.trim()).filter(Boolean), stock: Number(values.stock), active: values.active, featured: values.featured, description: values.description.trim() };
    saveProduct(product); setOpen(false); toast.success(editing ? "محصول ویرایش شد" : "محصول جدید ساخته شد");
  }
  function remove(product: Product) { if (window.confirm(`محصول «${product.name}» حذف شود؟`)) { deleteProduct(product.id); toast.success("محصول حذف شد"); } }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold text-brand">کاتالوگ فروشگاه</p><h1 className="mt-1 text-2xl font-black">مدیریت محصولات</h1><p className="mt-1.5 text-[10px] text-muted">قیمت، موجودی، تصاویر و وضعیت نمایش را کنترل کنید.</p></div><Button onClick={createProduct} className="self-start sm:self-auto"><PackagePlus className="size-4" />افزودن محصول</Button></div>
      <section className="grid gap-3 sm:grid-cols-3">{[[Package, "همه محصولات", products.length, "bg-blue-50 text-blue-700"], [TriangleAlert, "کم‌موجودی", lowStock, "bg-amber-50 text-amber-700"], [Package, "ناموجود", outOfStock, "bg-rose-50 text-rose-700"]].map(([Icon, label, value, tone]) => { const I = Icon as typeof Package; return <article key={String(label)} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><I className="size-5" /></span><div><strong className="text-lg font-black">{toFa(Number(value))}</strong><p className="text-[9px] text-muted">{String(label)}</p></div></article>; })}</section>
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white"><div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو با نام یا شناسه..." className="bg-stone-50 pr-10" /></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-[10px] font-bold outline-none"><option value="all">همه دسته‌بندی‌ها</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-[9px]"><thead className="bg-stone-50 text-muted"><tr><th className="px-5 py-3 font-medium">محصول</th><th className="px-3 py-3 font-medium">شناسه</th><th className="px-3 py-3 font-medium">قیمت</th><th className="px-3 py-3 font-medium">موجودی</th><th className="px-3 py-3 font-medium">نمایش</th><th className="px-5 py-3 font-medium">عملیات</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((product) => <tr key={product.id} className={!product.active ? "opacity-55" : "hover:bg-stone-50/70"}><td className="px-5 py-3"><div className="flex min-w-[250px] items-center gap-3"><img src={product.images[0] || productPlaceholderUrl} alt="" className="h-13 w-10 rounded-lg object-cover" /><div><strong className="line-clamp-1 max-w-[280px] text-[10px]">{product.name}</strong><span className="mt-1 block text-[8px] text-muted">{product.categoryName}</span></div></div></td><td className="px-3 py-3 font-medium" dir="ltr">{product.sku}</td><td className="px-3 py-3"><strong>{formatToman(product.price)}</strong>{product.regularPrice > product.price && <span className="mt-1 block text-[8px] text-muted line-through">{formatToman(product.regularPrice)}</span>}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 font-bold ${product.stock === 0 ? "bg-rose-50 text-rose-700" : product.stock <= 5 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{product.stock === 0 ? "ناموجود" : `${toFa(product.stock)} عدد`}</span></td><td className="px-3 py-3"><button type="button" onClick={() => toggleProduct(product.id)} className={`relative h-5 w-9 rounded-full transition ${product.active ? "bg-emerald-500" : "bg-stone-300"}`}><i className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition ${product.active ? "left-0.5" : "left-4.5"}`} /></button></td><td className="px-5 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" onClick={() => editProduct(product)}><Edit3 className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8 text-rose-600" onClick={() => remove(product)}><Trash2 className="size-3.5" /></Button></div></td></tr>)}</tbody></table></div>
        {!filtered.length && <p className="py-16 text-center text-xs text-muted">محصولی پیدا نشد.</p>}<div className="border-t border-border px-5 py-3 text-[9px] text-muted">نمایش {toFa(filtered.length)} محصول از {toFa(products.length)}</div>
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "ویرایش محصول" : "افزودن محصول جدید"} description="اطلاعات کاتالوگ و موجودی محصول" className="max-w-3xl"><form onSubmit={handleSubmit(submit)}><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><Field label="نام محصول" error={errors.name?.message} className="sm:col-span-2"><Input {...register("name")} /></Field><Field label="شناسه محصول" error={errors.sku?.message}><Input {...register("sku")} dir="ltr" /></Field><Field label="دسته‌بندی" error={errors.category?.message}><select {...register("category")} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-xs outline-none"><option value="">انتخاب کنید</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></Field><Field label="قیمت فروش (تومان)" error={errors.price?.message}><Input {...register("price")} inputMode="numeric" dir="ltr" /></Field><Field label="قیمت اصلی (تومان)" error={errors.regularPrice?.message}><Input {...register("regularPrice")} inputMode="numeric" dir="ltr" /></Field><Field label="موجودی" error={errors.stock?.message}><Input {...register("stock")} inputMode="numeric" dir="ltr" /></Field><Field label="سایزها (با ویرگول جدا کنید)" error={errors.sizes?.message}><Input {...register("sizes")} dir="ltr" /></Field><Field label="رنگ‌ها (با ویرگول جدا کنید)" error={errors.colors?.message} className="sm:col-span-2"><Input {...register("colors")} /></Field><Field label="نشانی تصاویر (هر تصویر یک خط)" error={errors.images?.message} className="sm:col-span-2"><Textarea {...register("images")} rows={3} dir="ltr" /></Field><Field label="توضیحات محصول" error={errors.description?.message} className="sm:col-span-2"><Textarea {...register("description")} rows={4} /></Field><label className="flex items-center justify-between rounded-xl border border-border p-3 text-[10px] font-bold">نمایش در فروشگاه<input type="checkbox" {...register("active")} className="size-4 accent-ink" /></label><label className="flex items-center justify-between rounded-xl border border-border p-3 text-[10px] font-bold">محصول منتخب<input type="checkbox" {...register("featured")} className="size-4 accent-ink" /></label></div><div className="flex justify-end gap-2 border-t border-border p-4"><Button type="button" variant="outline" onClick={() => setOpen(false)}>انصراف</Button><Button type="submit">ذخیره محصول</Button></div></form></Modal>
    </div>
  );
}
