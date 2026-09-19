import { Link } from "@tanstack/react-router";
import { ChevronLeft, Heart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductImageZoom } from "@/components/product/ProductImageZoom";
import { productPlaceholderUrl } from "@/lib/assets";
import { formatToman, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/use-store";

export function ProductPage({ slug }: { slug: string }) {
  const products = useStore((state) => state.products);
  const addToCart = useStore((state) => state.addToCart);
  const product = products.find((item) => item.slug === slug && item.active);
  const initialVariant = product?.variants?.find((item) => item.stock > 0);
  const [image, setImage] = useState(0);
  const [size, setSize] = useState(initialVariant?.size || product?.sizes[0] || "فری‌سایز");
  const [color, setColor] = useState(initialVariant?.color || product?.colors[0] || "پیش‌فرض");
  const [quantity, setQuantity] = useState(1);
  const related = useMemo(() => product ? products.filter((item) => item.active && item.id !== product.id && item.category === product.category).slice(0, 4) : [], [products, product]);
  const selectedVariant = product?.variants?.find((item) => item.size === size && item.color === color);
  const availableStock = product?.variants?.length ? (selectedVariant?.stock ?? 0) : (product?.stock ?? 0);

  if (!product) {
    return <div className="container-site py-24 text-center"><h1 className="text-2xl font-black">محصول پیدا نشد</h1><Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="mt-5 inline-block rounded-xl bg-ink px-5 py-3 text-xs font-bold text-white">بازگشت به فروشگاه</Link></div>;
  }

  function add() {
    if (!product || availableStock === 0) return;
    addToCart({ productId: product.id, size, color, quantity });
    toast.success("محصول به سبد خرید اضافه شد");
  }

  return (
    <div className="container-site py-7 sm:py-10">
      <nav className="flex flex-wrap items-center gap-2 text-[10px] text-muted"><Link to="/">خانه</Link><ChevronLeft className="size-3" /><Link to="/category/$slug" params={{ slug: product.category }}>{product.categoryName}</Link><ChevronLeft className="size-3" /><span className="line-clamp-1">{product.name}</span></nav>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <section className="grid gap-3 sm:grid-cols-[82px_1fr]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
            {(product.images.length ? product.images : [productPlaceholderUrl]).slice(0, 5).map((src, index) => (
              <button key={`${src}-${index}`} type="button" onClick={() => setImage(index)} className={cn("h-24 w-18 shrink-0 overflow-hidden rounded-xl border-2 bg-stone-100 sm:h-26 sm:w-full", image === index ? "border-ink" : "border-transparent")}><img src={src} alt="" className="size-full object-cover" /></button>
            ))}
          </div>
          <div className="order-1 aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-stone-100 sm:order-2"><ProductImageZoom src={product.images[image] || productPlaceholderUrl} alt={product.name} /></div>
        </section>

        <section className="self-center lg:py-8">
          <p className="text-[11px] font-bold text-brand">{product.categoryName}</p>
          <h1 className="mt-2 text-2xl leading-10 font-black sm:text-4xl sm:leading-[1.35]">{product.name}</h1>
          <p className="mt-2 text-[10px] text-muted" dir="ltr">SKU: {product.sku}</p>
          <div className="mt-6 flex items-center gap-3"><strong className="text-xl font-black">{formatToman(product.price)}</strong>{product.regularPrice > product.price && <span className="text-xs text-muted line-through">{formatToman(product.regularPrice)}</span>}</div>
          <p className="mt-6 text-xs leading-7 text-black/60">{product.description}</p>

          {product.colors.length > 0 && <div className="mt-7"><div className="flex items-center justify-between"><label className="text-xs font-black">رنگ</label><span className="text-[10px] text-muted">{color}</span></div><div className="mt-3 flex flex-wrap gap-2">{product.colors.map((item) => { const unavailable = Boolean(product.variants?.length) && !product.variants?.some((variant) => variant.color === item && variant.size === size && variant.stock > 0); return <button key={item} type="button" disabled={unavailable} onClick={() => { setColor(item); setQuantity(1); }} className={cn("rounded-xl border px-3 py-2 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-30", color === item ? "border-ink bg-ink text-white" : "border-border hover:border-ink")}>{item}</button>; })}</div></div>}
          {product.sizes.length > 0 && <div className="mt-6"><div className="flex items-center justify-between"><label className="text-xs font-black">سایز</label><button type="button" className="text-[10px] text-muted underline">راهنمای سایز</button></div><div className="mt-3 flex flex-wrap gap-2" dir="ltr">{product.sizes.map((item) => { const unavailable = Boolean(product.variants?.length) && !product.variants?.some((variant) => variant.size === item && variant.color === color && variant.stock > 0); return <button key={item} type="button" disabled={unavailable} onClick={() => { setSize(item); setQuantity(1); }} className={cn("min-w-11 rounded-xl border px-3 py-2 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-30", size === item ? "border-ink bg-ink text-white" : "border-border hover:border-ink")}>{item}</button>; })}</div></div>}

          <div className="mt-8 flex gap-2">
            <div className="flex h-13 items-center rounded-xl border border-border"><button type="button" className="grid size-10 place-items-center" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="size-4" /></button><span className="min-w-8 text-center text-xs font-bold">{toFa(quantity)}</span><button type="button" className="grid size-10 place-items-center" onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}><Plus className="size-4" /></button></div>
            <Button size="lg" className="flex-1" onClick={add} disabled={availableStock === 0}>{availableStock === 0 ? "این واریانت ناموجود است" : "افزودن به سبد خرید"}</Button>
            <Button size="icon" variant="outline" className="size-13" aria-label="علاقه‌مندی"><Heart className="size-5" /></Button>
          </div>
          <p className={`mt-3 text-[10px] font-bold ${availableStock > 0 ? "text-emerald-700" : "text-rose-700"}`}>{availableStock > 0 ? `${toFa(availableStock)} عدد از این انتخاب در انبار موجود است` : "این انتخاب فعلاً موجود نیست"}</p>
          <div className="mt-7 grid grid-cols-2 gap-2 border-t border-border pt-6 text-[10px]"><span className="flex items-center gap-2"><Truck className="size-4 text-brand" />ارسال سریع به سراسر ایران</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand" />تضمین اصالت و کیفیت</span></div>
        </section>
      </div>
      {related.length > 0 && <section className="mt-18 sm:mt-24"><p className="section-eyebrow">پیشنهاد برای شما</p><h2 className="section-title mb-7">محصولات مشابه</h2><ProductGrid products={related} /></section>}
    </div>
  );
}
