import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpLeft,
  Headphones,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { useMemo } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { productPlaceholderUrl } from "@/lib/assets";
import { toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";

const homeCategorySlugs = [
  "men-shirt",
  "men-pants",
  "men-t-shirts-and-sweatshirts",
  "men-shoes-and-boots",
  "men-accessories",
  "men-set",
];

const categoryLayout = [
  "sm:col-span-2 sm:row-span-2",
  "sm:col-span-1 sm:row-span-1",
  "sm:col-span-1 sm:row-span-1",
  "sm:col-span-2 sm:row-span-1",
];

export function HomePage() {
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const settings = useStore((state) => state.settings);
  const activeProducts = useMemo(() => products.filter((item) => item.active), [products]);
  const newArrivals = useMemo(() => [...activeProducts].sort((a, b) => b.id - a.id).slice(0, 8), [activeProducts]);
  const bestSellers = useMemo(
    () => [...activeProducts].sort((a, b) => Number(b.featured) - Number(a.featured) || a.stock - b.stock).slice(0, 8),
    [activeProducts],
  );
  const homeCategories = useMemo(
    () => homeCategorySlugs.map((slug) => categories.find((item) => item.slug === slug)).filter(Boolean),
    [categories],
  );
  const spotlight = newArrivals[0];
  const editorialProduct = newArrivals.find((item) => item.category === "men-shirt") ?? newArrivals[4];

  return (
    <>
      <section className="bg-[#efede7]">
        <div className="container-site grid min-h-[660px] gap-px bg-white/70 lg:grid-cols-[minmax(0,1.45fr)_minmax(310px,.55fr)]">
          <div className="relative min-h-[540px] overflow-hidden bg-ink lg:min-h-[660px]">
            <picture className="absolute inset-0">
              <source media="(max-width: 640px)" srcSet={settings.heroMobileImage} />
              <img src={settings.heroImage} alt="کالکشن جدید الون" className="size-full object-cover opacity-90" />
            </picture>
            <div className="absolute inset-0 bg-black/28" />
            <div className="relative z-10 flex h-full min-h-[540px] max-w-2xl flex-col justify-end p-6 text-white sm:p-10 lg:min-h-[660px] lg:p-14">
              <div className="mb-auto flex items-center justify-between text-[10px] font-bold tracking-[.22em] text-white/80" dir="ltr">
                <span>ELEVEN / EDIT 01</span>
                <span>2026</span>
              </div>
              <span className="mb-4 flex w-fit items-center gap-2 text-[11px] font-bold"><Sparkles className="size-4" /> انتخاب تازه ادیتورها</span>
              <h1 className="max-w-xl text-[clamp(2.5rem,6vw,5rem)] leading-[1.06] font-black tracking-[-.05em]">{settings.heroTitle}</h1>
              <p className="mt-5 max-w-lg text-xs leading-7 text-white/80 sm:text-sm">{settings.heroSubtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="inline-flex h-12 items-center gap-3 bg-white px-6 text-xs font-black text-ink transition hover:bg-[#eee9e2]">خرید کالکشن <ArrowLeft className="size-4" /></Link>
                <Link to="/shop" search={{ q: "", category: "", sort: "popular" }} className="inline-flex h-12 items-center gap-3 border border-white/50 px-6 text-xs font-bold text-white transition hover:bg-white hover:text-ink">پرفروش‌های هفته</Link>
              </div>
            </div>
          </div>

          <div className="grid min-h-[420px] grid-rows-[.78fr_1.22fr] gap-px bg-white/70">
            <div className="flex flex-col justify-between bg-[#ded9cf] p-7 sm:p-9">
              <div className="flex items-start justify-between text-[10px] font-bold text-black/45"><span>داستان این فصل</span><span dir="ltr">01—26</span></div>
              <div>
                <p className="max-w-[15rem] text-2xl leading-[1.45] font-black tracking-[-.03em] sm:text-3xl">لباس‌هایی برای هر روز؛ جزئیاتی برای متفاوت‌بودن.</p>
                <Link to="/category/$slug" params={{ slug: "men-shirt" }} className="mt-5 inline-flex items-center gap-2 border-b border-ink pb-1 text-[11px] font-black">دیدن ادیت روزمره <ArrowUpLeft className="size-4" /></Link>
              </div>
            </div>
            {spotlight && (
              <Link to="/product/$slug" params={{ slug: spotlight.slug }} className="group relative min-h-[300px] overflow-hidden bg-stone-200">
                <img src={spotlight.images[0] || productPlaceholderUrl} alt={spotlight.name} className="size-full object-cover transition duration-700 group-hover:scale-[1.025]" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-black/52 p-5 text-white">
                  <div><span className="text-[9px] text-white/65">تازه رسیده</span><h2 className="mt-1 max-w-[13rem] text-sm font-black">{spotlight.name}</h2></div>
                  <span className="grid size-10 shrink-0 place-items-center border border-white/50"><ArrowUpLeft className="size-4" /></span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white">
        <div className="container-site flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {homeCategories.map((category) => category && (
            <Link key={category.id} to="/category/$slug" params={{ slug: category.slug }} className="flex shrink-0 items-center gap-2 border border-border bg-white px-4 py-2.5 text-[11px] font-bold transition hover:border-ink hover:bg-ink hover:text-white">
              {category.name}
              <span className="text-[9px] opacity-55">{toFa(activeProducts.filter((item) => item.categorySlugs.includes(category.slug) || item.category === category.slug).length)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-site py-16 sm:py-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="section-eyebrow">JUST IN / تازه رسیده</p><h2 className="section-title">اولین نفر باش که می‌پوشد</h2></div>
          <Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="flex shrink-0 items-center gap-2 text-xs font-bold hover:text-brand">همه تازه‌ها <ArrowLeft className="size-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-5">
          {newArrivals.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="container-site pb-16 sm:pb-24">
        <div className="mb-8 flex items-end justify-between">
          <div><p className="section-eyebrow">SHOP BY MOOD</p><h2 className="section-title">از حال‌وهوایت شروع کن</h2></div>
          <p className="hidden max-w-sm text-left text-[11px] leading-6 text-muted sm:block">دسته‌بندی‌هایی که هر کدام یک استایل کامل را می‌سازند.</p>
        </div>
        <div className="grid auto-rows-[230px] grid-cols-2 gap-2 sm:auto-rows-[250px] sm:grid-cols-4 lg:auto-rows-[290px]">
          {homeCategories.slice(0, 4).map((category, index) => category && (
            <Link key={category.id} to="/category/$slug" params={{ slug: category.slug }} className={`group relative overflow-hidden bg-stone-100 ${categoryLayout[index]}`}>
              <img src={category.image} alt={category.name} loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-[1.035]" />
              <div className="absolute inset-0 bg-black/22 transition group-hover:bg-black/35" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white sm:p-6">
                <div><p className="text-[9px] text-white/70">{toFa(activeProducts.filter((item) => item.categorySlugs.includes(category.slug) || item.category === category.slug).length)} انتخاب</p><h3 className="mt-1 text-base font-black sm:text-xl">{category.name}</h3></div>
                <ArrowUpLeft className="size-5 shrink-0 transition group-hover:-translate-x-1 group-hover:-translate-y-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {editorialProduct && (
        <section className="bg-[#171717] text-white">
          <div className="container-site grid min-h-[560px] lg:grid-cols-[.8fr_1.2fr]">
            <div className="flex flex-col justify-between py-10 lg:py-14 lg:pl-14">
              <p className="text-[10px] font-bold tracking-[.18em] text-white/48" dir="ltr">THE ELEVEN UNIFORM / 02</p>
              <div className="py-12 lg:py-8">
                <p className="text-[10px] font-black text-[#c9a96a]">راهنمای استایل</p>
                <h2 className="mt-4 max-w-md text-3xl leading-[1.35] font-black tracking-[-.04em] sm:text-5xl">کمتر انتخاب کن، بهتر ست کن.</h2>
                <p className="mt-5 max-w-md text-xs leading-7 text-white/58">یک کمد حساب‌شده با رنگ‌های خنثی و برش‌های درست؛ قطعه‌هایی که از صبح تا شب کنار هم کار می‌کنند.</p>
                <Link to="/product/$slug" params={{ slug: editorialProduct.slug }} className="mt-7 inline-flex h-11 items-center gap-3 border border-white/35 px-5 text-xs font-bold transition hover:bg-white hover:text-ink">دیدن این انتخاب <ArrowLeft className="size-4" /></Link>
              </div>
              <p className="text-[10px] text-white/38">ELEVEN STYLE — QOM / IRAN</p>
            </div>
            <div className="relative min-h-[420px] overflow-hidden bg-stone-800">
              <img src={editorialProduct.images[1] || editorialProduct.images[0] || productPlaceholderUrl} alt={editorialProduct.name} className="size-full object-cover" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between bg-white p-4 text-ink sm:bottom-7 sm:left-7 sm:right-auto sm:w-[320px]">
                <div><p className="text-[9px] text-muted">انتخاب ادیتور</p><strong className="mt-1 block text-xs">{editorialProduct.name}</strong></div>
                <ArrowUpLeft className="size-5" />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-site py-16 sm:py-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="section-eyebrow">BEST SELLERS</p><h2 className="section-title">انتخاب‌های امتحان‌پس‌داده</h2></div>
          <Link to="/shop" search={{ q: "", category: "", sort: "popular" }} className="flex shrink-0 items-center gap-2 text-xs font-bold hover:text-brand">همه پرفروش‌ها <ArrowLeft className="size-4" /></Link>
        </div>
        <ProductGrid products={bestSellers} />
      </section>

      <section className="border-y border-border bg-[#f6f5f1]">
        <div className="container-site grid grid-cols-2 gap-y-9 py-11 lg:grid-cols-4 lg:py-14">
          {[
            [Truck, "ارسال سریع", "تحویل امن به سراسر ایران"],
            [RefreshCw, "ضمانت بازگشت", "تا ۷ روز پس از تحویل"],
            [ShieldCheck, "خرید مطمئن", "تضمین اصالت و کیفیت کالا"],
            [Headphones, "پشتیبانی واقعی", "همراه شما پیش و پس از خرید"],
          ].map(([Icon, title, text]) => {
            const FeatureIcon = Icon as typeof Truck;
            return (
              <div key={String(title)} className="flex flex-col items-center px-3 text-center lg:border-l lg:border-black/8 lg:last:border-0">
                <FeatureIcon className="size-6 text-brand" />
                <strong className="mt-3 text-xs font-black">{String(title)}</strong>
                <span className="mt-1 text-[10px] text-muted">{String(text)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
