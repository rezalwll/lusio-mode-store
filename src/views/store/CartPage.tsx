"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartLines } from "@/hooks/use-cart-lines";
import { productPlaceholderUrl } from "@/lib/assets";
import { calculateDiscount } from "@/lib/cart-pricing";
import { formatToman, toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";

export function CartPage() {
  const { lines, subtotal, count } = useCartLines();
  const settings = useStore((state) => state.settings);
  const coupons = useStore((state) => state.coupons);
  const appliedCoupon = useStore((state) => state.appliedCoupon);
  const setAppliedCoupon = useStore((state) => state.setAppliedCoupon);
  const setQuantity = useStore((state) => state.setCartQuantity);
  const remove = useStore((state) => state.removeFromCart);
  const [couponCode, setCouponCode] = useState(appliedCoupon);
  const discount = calculateDiscount(coupons, appliedCoupon, subtotal);
  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost;
  const total = Math.max(0, subtotal - discount + shipping);

  function applyCoupon() {
    const coupon = coupons.find((item) => item.active && item.code.toLowerCase() === couponCode.trim().toLowerCase());
    if (!coupon) { toast.error("کد تخفیف معتبر نیست"); return; }
    if (subtotal < coupon.minOrder) { toast.error(`حداقل خرید برای این کد ${formatToman(coupon.minOrder)} است`); return; }
    if (new Date(coupon.expiresAt) < new Date()) { toast.error("اعتبار این کد تمام شده است"); return; }
    setAppliedCoupon(coupon.code);
    toast.success("کد تخفیف اعمال شد");
  }

  if (lines.length === 0) {
    return (
      <div className="container-site flex min-h-[62vh] flex-col items-center justify-center py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-stone-100"><ShoppingBag className="size-8 text-muted" /></span>
        <h1 className="mt-6 text-2xl font-black">سبد خریدت خالی است</h1>
        <p className="mt-2 text-xs text-muted">بین محصولات الون بگرد و استایل بعدی‌ات را پیدا کن.</p>
        <Link href="/shop?q=&category=&sort=newest" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-xs font-bold text-white">مشاهده محصولات <ArrowLeft className="size-4" /></Link>
      </div>
    );
  }

  return (
    <div className="container-site py-9 sm:py-13">
      <div><p className="section-eyebrow">خرید شما</p><h1 className="section-title">سبد خرید <span className="text-sm font-medium text-muted">({toFa(count)} کالا)</span></h1></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] xl:gap-12">
        <section className="divide-y divide-border border-y border-border">
          {lines.map((line) => (
            <article key={`${line.productId}-${line.size}-${line.color}`} className="flex gap-4 py-5 sm:gap-5">
              <Link href={`/product/${line.product.slug}`} className="h-35 w-26 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-42 sm:w-32"><img src={line.product.images[0] || productPlaceholderUrl} alt={line.product.name} className="size-full object-cover" /></Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${line.product.slug}`} className="line-clamp-2 text-xs font-black leading-6 sm:text-sm">{line.product.name}</Link>
                <p className="mt-1 text-[10px] text-muted">{line.product.categoryName}</p>
                <p className="mt-2 text-[10px] text-muted">سایز: {line.size} · رنگ: {line.color}</p>
                <strong className="mt-3 block text-xs sm:text-sm">{formatToman(line.total)}</strong>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex h-9 items-center rounded-lg border border-border"><button type="button" className="grid size-8 place-items-center" onClick={() => setQuantity(line.productId, line.size, line.color, line.quantity - 1)}><Minus className="size-3.5" /></button><span className="min-w-7 text-center text-[11px] font-bold">{toFa(line.quantity)}</span><button type="button" className="grid size-8 place-items-center" onClick={() => setQuantity(line.productId, line.size, line.color, Math.min(line.product.stock, line.quantity + 1))}><Plus className="size-3.5" /></button></div>
                  <button type="button" className="flex items-center gap-1 text-[10px] text-muted hover:text-brand" onClick={() => remove(line.productId, line.size, line.color)}><Trash2 className="size-3.5" /> حذف</button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-stone-50 p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="font-black">خلاصه سفارش</h2>
          <dl className="mt-5 space-y-3 text-xs">
            <div className="flex justify-between"><dt className="text-muted">مبلغ کالاها</dt><dd>{formatToman(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">هزینه ارسال</dt><dd>{shipping ? formatToman(shipping) : <span className="font-bold text-emerald-700">رایگان</span>}</dd></div>
            {discount > 0 && <div className="flex justify-between text-brand"><dt>تخفیف</dt><dd>- {formatToman(discount)}</dd></div>}
            <div className="flex justify-between border-t border-border pt-4 text-sm font-black"><dt>مبلغ قابل پرداخت</dt><dd>{formatToman(total)}</dd></div>
          </dl>
          <div className="mt-5 flex gap-2"><input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="کد تخفیف" className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 text-[11px] uppercase outline-none focus:border-ink" dir="ltr" /><Button type="button" variant="outline" size="sm" className="h-10" onClick={applyCoupon}>اعمال</Button></div>
          <Link href="/checkout" className="mt-5 grid h-12 place-items-center rounded-xl bg-brand text-sm font-black text-white shadow-[0_8px_24px_rgba(211,33,58,.18)]">ادامه و تسویه حساب</Link>
          <p className="mt-4 flex items-center justify-center gap-2 text-[9px] text-muted"><Truck className="size-4" />ارسال رایگان برای خرید بالای {formatToman(settings.freeShippingThreshold)}</p>
        </aside>
      </div>
    </div>
  );
}
