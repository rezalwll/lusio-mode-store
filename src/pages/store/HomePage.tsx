import { Link } from "@tanstack/react-router";
import { ArrowLeft, Headphones, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { useMemo } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
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

export function HomePage() {
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const settings = useStore((state) => state.settings);
  const activeProducts = useMemo(() => products.filter((item) => item.active), [products]);
  const featured = useMemo(() => activeProducts.filter((item) => item.featured).slice(0, 8), [activeProducts]);
  const popular = useMemo(() => activeProducts.slice(18, 26), [activeProducts]);
  const homeCategories = useMemo(
    () => homeCategorySlugs.map((slug) => categories.find((item) => item.slug === slug)).filter(Boolean),
    [categories],
  );

  return (
    <>
      <section className="container-site pt-4 sm:pt-6">
        <div className="relative min-h-[520px] overflow-hidden rounded-[1.75rem] bg-ink sm:min-h-[610px] lg:min-h-[670px]">
          <picture className="absolute inset-0">
            <source media="(max-width: 640px)" srcSet={settings.heroMobileImage} />
            <img src={settings.heroImage} alt="کالکشن جدید الون" className="size-full object-cover opacity-84" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/20 to-transparent max-sm:bg-gradient-to-t max-sm:from-black/85 max-sm:via-black/20" />
          <div className="relative z-10 flex min-h-[520px] max-w-xl flex-col justify-end p-6 text-white sm:min-h-[610px] sm:justify-center sm:p-12 lg:min-h-[670px] lg:p-18">
            <span className="mb-4 w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-bold backdrop-blur">کالکشن پاییز ۱۴۰۵</span>
            <h1 className="max-w-lg text-4xl leading-[1.2] font-black tracking-tight sm:text-6xl lg:text-7xl">{settings.heroTitle}</h1>
            <p className="mt-5 max-w-md text-xs leading-7 text-white/72 sm:text-sm">{settings.heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="inline-flex h-12 items-center gap-3 rounded-xl bg-white px-6 text-sm font-black text-ink transition hover:-translate-y-0.5">مشاهده کالکشن <ArrowLeft className="size-4" /></Link>
              <Link to="/category/$slug" params={{ slug: "men-shoes-and-boots" }} className="inline-flex h-12 items-center rounded-xl border border-white/30 bg-white/8 px-6 text-sm font-bold backdrop-blur hover:bg-white/15">کفش و کتونی</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-site py-14 sm:py-20">
        <div className="mb-7 flex items-end justify-between">
          <div><p className="section-eyebrow">دسته‌بندی‌ها</p><h2 className="section-title">استایل خودت را پیدا کن</h2></div>
          <Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="hidden items-center gap-2 text-xs font-bold hover:text-brand sm:flex">همه محصولات <ArrowLeft className="size-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {homeCategories.map((category) => category && (
            <Link key={category.id} to="/category/$slug" params={{ slug: category.slug }} className="group min-w-0">
              <div className="aspect-square overflow-hidden rounded-[1.35rem] bg-stone-100">
                <img src={category.image} alt={category.name} loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <h3 className="mt-3 truncate text-center text-xs font-black sm:text-[13px]">{category.name}</h3>
              <p className="mt-1 text-center text-[10px] text-muted">{toFa(activeProducts.filter((item) => item.categorySlugs.includes(category.slug) || item.category === category.slug).length)} محصول</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-site pb-16 sm:pb-22">
        <div className="mb-7 flex items-end justify-between">
          <div><p className="section-eyebrow">تازه رسیده‌ها</p><h2 className="section-title">جدیدترین انتخاب‌های الون</h2></div>
          <Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="flex items-center gap-2 text-xs font-bold hover:text-brand">مشاهده همه <ArrowLeft className="size-4" /></Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      <section className="container-site pb-16 sm:pb-22">
        <div className="grid min-h-[420px] overflow-hidden rounded-[1.75rem] bg-[#eee9e2] lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="section-eyebrow">راهنمای استایل</p>
            <h2 className="mt-2 max-w-md text-3xl leading-tight font-black sm:text-5xl">سادگی، بهترین امضای استایل توست.</h2>
            <p className="mt-5 max-w-md text-xs leading-7 text-black/55 sm:text-sm">قطعه‌های مینیمال، رنگ‌های خنثی و برش‌های دقیق؛ ترکیبی که هر روز بدون تلاش زیاد، مرتب و متفاوت دیده می‌شود.</p>
            <Link to="/category/$slug" params={{ slug: "men-shirt" }} className="mt-7 inline-flex h-11 w-fit items-center gap-3 rounded-xl bg-ink px-5 text-xs font-bold text-white">خرید پیراهن مردانه <ArrowLeft className="size-4" /></Link>
          </div>
          <img src="https://elevenstyle.ir/wp-content/uploads/2026/07/Shirt.webp" alt="استایل مردانه مینیمال" className="h-full max-h-[500px] w-full object-cover lg:max-h-none" />
        </div>
      </section>

      <section className="container-site pb-16 sm:pb-22">
        <div className="mb-7"><p className="section-eyebrow">محبوب‌ترین‌ها</p><h2 className="section-title">انتخاب مشتری‌های الون</h2></div>
        <ProductGrid products={popular} />
      </section>

      <section className="border-y border-border bg-stone-50">
        <div className="container-site grid grid-cols-2 gap-y-8 py-10 lg:grid-cols-4 lg:py-13">
          {[
            [Truck, "ارسال سریع", "تحویل امن به سراسر ایران"],
            [RefreshCw, "ضمانت بازگشت", "تا ۷ روز پس از تحویل"],
            [ShieldCheck, "خرید مطمئن", "تضمین اصالت و کیفیت کالا"],
            [Headphones, "پشتیبانی واقعی", "همراه شما پیش و پس از خرید"],
          ].map(([Icon, title, text]) => {
            const FeatureIcon = Icon as typeof Truck;
            return (
              <div key={String(title)} className="flex flex-col items-center px-3 text-center lg:border-l lg:border-border lg:last:border-0">
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
