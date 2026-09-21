"use client";

import Link from "next/link";
import { ChevronLeft, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";

interface ShopPageProps {
  initialQuery?: string;
  initialCategory?: string;
  initialSort?: string;
  lockedCategory?: string;
}

export function ShopPage({ initialQuery = "", initialCategory = "", initialSort = "newest", lockedCategory }: ShopPageProps) {
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(lockedCategory || initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const currentCategory = categories.find((item) => item.slug === (lockedCategory || category));

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fa");
    return products
      .filter((product) => product.active)
      .filter((product) => !term || `${product.name} ${product.categoryName}`.toLocaleLowerCase("fa").includes(term))
      .filter((product) => !(lockedCategory || category) || product.category === (lockedCategory || category) || product.categorySlugs.includes(lockedCategory || category))
      .filter((product) => !onlyAvailable || product.stock > 0)
      .filter((product) => sort !== "sale" || product.regularPrice > product.price)
      .sort((a, b) => {
        if (sort === "price-low") return a.price - b.price;
        if (sort === "price-high") return b.price - a.price;
        if (sort === "popular") return Number(b.featured) - Number(a.featured);
        if (sort === "sale") return (b.regularPrice - b.price) - (a.regularPrice - a.price);
        return b.id - a.id;
      });
  }, [products, query, category, lockedCategory, onlyAvailable, sort]);

  const filters = (
    <div className="space-y-7">
      <div className="flex items-center justify-between"><h3 className="font-black">فیلتر محصولات</h3>{filtersOpen && <button type="button" onClick={() => setFiltersOpen(false)}><X className="size-5" /></button>}</div>
      <div>
        <label className="text-[11px] font-bold">جستجو</label>
        <div className="relative mt-2"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-white pr-10 pl-3 text-xs outline-none focus:border-ink" placeholder="نام محصول..." /></div>
      </div>
      {!lockedCategory && (
        <div>
          <label className="text-[11px] font-bold">دسته‌بندی</label>
          <div className="mt-2 grid max-h-60 gap-1 overflow-y-auto">
            <button type="button" onClick={() => setCategory("")} className={`rounded-lg px-3 py-2 text-right text-[11px] ${!category ? "bg-ink font-bold text-white" : "hover:bg-stone-100"}`}>همه محصولات</button>
            {categories.filter((item) => item.parent === 0 && item.active).map((item) => (
              <button key={item.id} type="button" onClick={() => setCategory(item.slug)} className={`rounded-lg px-3 py-2 text-right text-[11px] ${category === item.slug ? "bg-ink font-bold text-white" : "hover:bg-stone-100"}`}>{item.name}</button>
            ))}
          </div>
        </div>
      )}
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3 text-[11px] font-bold">
        فقط کالاهای موجود
        <input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} className="size-4 accent-brand" />
      </label>
    </div>
  );

  return (
    <div className="container-site py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-[10px] text-muted"><Link href="/">خانه</Link><ChevronLeft className="size-3" /><span>{currentCategory?.name || "فروشگاه"}</span></nav>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-black sm:text-4xl">{currentCategory?.name || "همه محصولات"}</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-muted">{currentCategory?.description || "کالکشن کامل پوشاک، کفش و اکسسوری مردانه الون استایل"}</p></div>
        <p className="text-[11px] text-muted">{toFa(visible.length)} محصول</p>
      </div>

      <div className="mt-8 flex items-center justify-between border-y border-border py-3 lg:justify-end">
        <button type="button" onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 text-xs font-bold lg:hidden"><Filter className="size-4" /> فیلترها</button>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] font-bold outline-none">
          <option value="newest">جدیدترین</option><option value="popular">محبوب‌ترین</option><option value="sale">تخفیف‌دارها</option><option value="price-low">ارزان‌ترین</option><option value="price-high">گران‌ترین</option>
        </select>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr] xl:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <ProductGrid products={visible} />
      </div>

      <div className={`fixed inset-0 z-70 bg-black/45 transition lg:hidden ${filtersOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setFiltersOpen(false)}>
        <aside className={`h-full w-[310px] max-w-[86vw] overflow-y-auto bg-white p-5 transition-transform ${filtersOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(event) => event.stopPropagation()}>{filters}</aside>
      </div>
    </div>
  );
}
