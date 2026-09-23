"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, CreditCard, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useCartLines } from "@/hooks/use-cart-lines";
import { formatToman } from "@/lib/format";
import { placeOrderAction, quoteCartAction, type CheckoutQuoteResult } from "@/server/actions/checkout";
import { useStore } from "@/store/use-store";
import type { Product, StoreSettings } from "@/types/store";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "نام را کامل وارد کنید"), lastName: z.string().min(2, "نام خانوادگی را کامل وارد کنید"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"), email: z.union([z.literal(""), z.email("ایمیل معتبر نیست")]),
  province: z.string().min(2, "استان را وارد کنید"), city: z.string().min(2, "شهر را وارد کنید"),
  postalCode: z.string().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"), address: z.string().min(10, "نشانی کامل را وارد کنید"),
  note: z.string().optional(), shippingMethod: z.enum(["پست پیشتاز", "تیپاکس", "تحویل حضوری"]),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

export function CheckoutPage({ products, settings }: { products: Product[]; settings: StoreSettings }) {
  const cart = useStore((state) => state.cart);
  const appliedCoupon = useStore((state) => state.appliedCoupon);
  const clearCart = useStore((state) => state.clearCart);
  const { lines, subtotal } = useCartLines(products);
  const [quote, setQuote] = useState<Extract<CheckoutQuoteResult, { ok: true }> | null>(null);
  const [completed, setCompleted] = useState<{ orderId: string; total: number; trackingToken?: string } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema), defaultValues: { email: "", note: "", shippingMethod: "پست پیشتاز" } });
  const shippingMethod = useWatch({ control, name: "shippingMethod" });

  useEffect(() => {
    let current = true;
    if (!cart.length) return;
    void quoteCartAction({ lines: cart, couponCode: appliedCoupon, shippingMethod }).then((result) => {
      if (!current) return;
      if (result.ok) setQuote(result);
      else { setQuote(null); if (appliedCoupon) toast.error(result.message); }
    });
    return () => { current = false; };
  }, [appliedCoupon, cart, shippingMethod]);

  const shipping = quote?.shipping ?? (shippingMethod === "تحویل حضوری" || subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost);
  const discount = quote?.discount ?? 0;
  const total = quote?.total ?? subtotal + shipping;

  async function submit(values: CheckoutForm) {
    const requestKey = idempotencyKey ?? crypto.randomUUID();
    if (!idempotencyKey) setIdempotencyKey(requestKey);
    const result = await placeOrderAction({ ...values, lines: cart, couponCode: appliedCoupon, idempotencyKey: requestKey });
    if (!result.ok) return toast.error(result.message);
    setCompleted({ orderId: result.orderId, total: result.total, trackingToken: result.trackingToken });
    clearCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (completed) {
    const trackingHref = `/tracking?order=${encodeURIComponent(completed.orderId)}${completed.trackingToken ? `&token=${encodeURIComponent(completed.trackingToken)}` : ""}`;
    return <div className="container-site flex min-h-[65vh] flex-col items-center justify-center py-20 text-center"><span className="grid size-21 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-10" /></span><p className="mt-6 text-[11px] font-bold text-amber-700">در انتظار پرداخت</p><h1 className="mt-2 text-3xl font-black">سفارش شما ثبت شد</h1><p className="mt-3 text-xs text-muted">شماره سفارش: <strong className="text-ink" dir="ltr">{completed.orderId}</strong></p><p className="mt-1 text-xs text-muted">مبلغ نهایی: <strong className="text-ink">{formatToman(completed.total)}</strong></p><p className="mt-2 max-w-md text-xs leading-6 text-muted">درگاه پرداخت هنوز متصل نشده است؛ سفارش با وضعیت «در انتظار پرداخت» ثبت شد و هیچ پرداخت موفقی شبیه‌سازی نشده است.</p><div className="mt-7 flex flex-wrap justify-center gap-2"><Link href={trackingHref} className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-xs font-bold text-white">پیگیری سفارش</Link><Link href="/shop?q=&category=&sort=newest" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-xs font-bold">ادامه خرید</Link></div></div>;
  }
  if (!lines.length) return <div className="container-site py-24 text-center"><h1 className="text-2xl font-black">سبد خرید خالی است</h1><Link href="/shop?q=&category=&sort=newest" className="mt-6 inline-block rounded-xl bg-ink px-5 py-3 text-xs font-bold text-white">بازگشت به فروشگاه</Link></div>;

  return (
    <div className="container-site py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-[10px] text-muted"><Link href="/cart">سبد خرید</Link><ChevronLeft className="size-3" /><span>تسویه حساب</span></nav><div className="mt-5"><p className="section-eyebrow">مرحله نهایی</p><h1 className="section-title">تکمیل و ثبت سفارش</h1></div>
      <form className="mt-8 grid gap-8 lg:grid-cols-[1fr_370px] xl:gap-12" onSubmit={handleSubmit(submit)}>
        <div className="space-y-8">
          <section className="rounded-2xl border border-border p-5 sm:p-7"><h2 className="text-sm font-black">اطلاعات تحویل‌گیرنده</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="نام" error={errors.firstName?.message}><Input {...register("firstName")} /></Field><Field label="نام خانوادگی" error={errors.lastName?.message}><Input {...register("lastName")} /></Field><Field label="شماره موبایل" error={errors.phone?.message}><Input {...register("phone")} inputMode="tel" placeholder="09123456789" dir="ltr" /></Field><Field label="ایمیل (اختیاری)" error={errors.email?.message}><Input {...register("email")} type="email" dir="ltr" /></Field><Field label="استان" error={errors.province?.message}><Input {...register("province")} /></Field><Field label="شهر" error={errors.city?.message}><Input {...register("city")} /></Field><Field label="کد پستی" error={errors.postalCode?.message}><Input {...register("postalCode")} inputMode="numeric" dir="ltr" /></Field><Field label="نشانی کامل" error={errors.address?.message} className="sm:col-span-2"><Textarea {...register("address")} rows={3} /></Field><Field label="توضیحات سفارش (اختیاری)" className="sm:col-span-2"><Textarea {...register("note")} rows={3} /></Field></div></section>
          <section className="rounded-2xl border border-border p-5 sm:p-7"><h2 className="text-sm font-black">روش ارسال</h2><div className="mt-5 grid gap-2">{["پست پیشتاز", "تیپاکس", "تحویل حضوری"].map((method) => <label key={method} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 text-xs font-bold has-[:checked]:border-ink has-[:checked]:bg-stone-50"><input type="radio" value={method} {...register("shippingMethod")} className="accent-ink" /><span>{method}</span><small className="mr-auto text-[9px] font-normal text-muted">{method === "تحویل حضوری" ? "رایگان" : "۳ تا ۷ روز کاری"}</small></label>)}</div></section>
          <section className="rounded-2xl border border-border p-5 sm:p-7"><h2 className="text-sm font-black">روش پرداخت</h2><label className="mt-5 flex items-center gap-3 rounded-xl border border-ink bg-stone-50 p-4 text-xs font-bold"><input type="radio" checked readOnly className="accent-ink" /><CreditCard className="size-5" />پرداخت اینترنتی (درگاه در حال اتصال)</label></section>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-stone-50 p-5 sm:p-6 lg:sticky lg:top-28"><h2 className="font-black">سفارش شما</h2><ul className="mt-4 divide-y divide-border">{lines.map((line) => <li key={`${line.productId}-${line.size}-${line.color}`} className="flex justify-between gap-3 py-3 text-[10px]"><span className="line-clamp-2">{line.product.name} × {line.quantity}</span><strong className="shrink-0">{formatToman(line.total)}</strong></li>)}</ul><dl className="mt-4 space-y-3 border-t border-border pt-4 text-xs"><div className="flex justify-between"><dt className="text-muted">جمع کالاها</dt><dd>{formatToman(subtotal)}</dd></div><div className="flex justify-between"><dt className="text-muted">ارسال</dt><dd>{shipping ? formatToman(shipping) : "رایگان"}</dd></div>{discount > 0 && <div className="flex justify-between text-brand"><dt>تخفیف {appliedCoupon}</dt><dd>- {formatToman(discount)}</dd></div>}<div className="flex justify-between border-t border-border pt-4 text-sm font-black"><dt>مبلغ نهایی</dt><dd>{formatToman(total)}</dd></div></dl><Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>{isSubmitting ? "در حال ثبت امن سفارش..." : "ثبت سفارش"}</Button><p className="mt-4 flex items-center justify-center gap-2 text-center text-[9px] leading-5 text-muted"><ShieldCheck className="size-4 shrink-0" />مبلغ و موجودی هنگام ثبت، دوباره در سرور بررسی می‌شود.</p></aside>
      </form>
    </div>
  );
}
