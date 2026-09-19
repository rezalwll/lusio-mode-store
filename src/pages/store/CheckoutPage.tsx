import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, CreditCard, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useCartLines } from "@/hooks/use-cart-lines";
import { formatToman } from "@/lib/format";
import { useStore } from "@/store/use-store";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "نام را کامل وارد کنید"),
  lastName: z.string().min(2, "نام خانوادگی را کامل وارد کنید"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  email: z.union([z.literal(""), z.email("ایمیل معتبر نیست")]),
  province: z.string().min(2, "استان را وارد کنید"),
  city: z.string().min(2, "شهر را وارد کنید"),
  postalCode: z.string().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  address: z.string().min(10, "نشانی کامل را وارد کنید"),
  note: z.string().optional(),
  shippingMethod: z.enum(["پست پیشتاز", "تیپاکس", "تحویل حضوری"]),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const { lines, subtotal } = useCartLines();
  const settings = useStore((state) => state.settings);
  const coupons = useStore((state) => state.coupons);
  const appliedCoupon = useStore((state) => state.appliedCoupon);
  const placeOrder = useStore((state) => state.placeOrder);
  const [orderId, setOrderId] = useState("");
  const coupon = coupons.find((item) => item.active && item.code.toLowerCase() === appliedCoupon.toLowerCase());
  const discount = coupon && subtotal >= coupon.minOrder
    ? Math.min(coupon.type === "percent" ? Math.round(subtotal * coupon.value / 100) : coupon.value, subtotal)
    : 0;
  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost;
  const total = Math.max(0, subtotal - discount + shipping);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { email: "", note: "", shippingMethod: "پست پیشتاز" },
  });

  async function submit(values: CheckoutForm) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const id = placeOrder({
      customerName: `${values.firstName} ${values.lastName}`,
      phone: values.phone,
      city: values.city,
      address: `${values.province}، ${values.city}، ${values.address}`,
      postalCode: values.postalCode,
      shippingMethod: values.shippingMethod,
      total,
    });
    setOrderId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (orderId) {
    return (
      <div className="container-site flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
        <span className="grid size-21 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-10" /></span>
        <p className="mt-6 text-[11px] font-bold text-emerald-700">پرداخت با موفقیت انجام شد</p>
        <h1 className="mt-2 text-3xl font-black">سفارش شما ثبت شد</h1>
        <p className="mt-3 text-xs text-muted">شماره سفارش: <strong className="text-ink" dir="ltr">{orderId}</strong></p>
        <p className="mt-1 max-w-md text-xs leading-6 text-muted">اطلاعات سفارش در حساب شما ذخیره شد و از بخش پیگیری سفارش قابل مشاهده است.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link to="/tracking" search={{ code: orderId }} className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-xs font-bold text-white">پیگیری سفارش</Link>
          <Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-xs font-bold">ادامه خرید</Link>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return <div className="container-site py-24 text-center"><h1 className="text-2xl font-black">سبد خرید خالی است</h1><Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="mt-6 inline-block rounded-xl bg-ink px-5 py-3 text-xs font-bold text-white">بازگشت به فروشگاه</Link></div>;
  }

  return (
    <div className="container-site py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-[10px] text-muted"><Link to="/cart">سبد خرید</Link><ChevronLeft className="size-3" /><span>تسویه حساب</span></nav>
      <div className="mt-5"><p className="section-eyebrow">مرحله نهایی</p><h1 className="section-title">تکمیل و ثبت سفارش</h1></div>
      <form className="mt-8 grid gap-8 lg:grid-cols-[1fr_370px] xl:gap-12" onSubmit={handleSubmit(submit)}>
        <div className="space-y-8">
          <section className="rounded-2xl border border-border p-5 sm:p-7">
            <h2 className="text-sm font-black">اطلاعات تحویل‌گیرنده</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="نام" error={errors.firstName?.message}><Input {...register("firstName")} /></Field>
              <Field label="نام خانوادگی" error={errors.lastName?.message}><Input {...register("lastName")} /></Field>
              <Field label="شماره موبایل" error={errors.phone?.message}><Input {...register("phone")} inputMode="tel" placeholder="09123456789" dir="ltr" /></Field>
              <Field label="ایمیل (اختیاری)" error={errors.email?.message}><Input {...register("email")} type="email" dir="ltr" /></Field>
              <Field label="استان" error={errors.province?.message}><Input {...register("province")} /></Field>
              <Field label="شهر" error={errors.city?.message}><Input {...register("city")} /></Field>
              <Field label="کد پستی" error={errors.postalCode?.message}><Input {...register("postalCode")} inputMode="numeric" dir="ltr" /></Field>
              <Field label="نشانی کامل" error={errors.address?.message} className="sm:col-span-2"><Textarea {...register("address")} rows={3} /></Field>
              <Field label="توضیحات سفارش (اختیاری)" className="sm:col-span-2"><Textarea {...register("note")} rows={3} placeholder="نکته‌ای برای بسته‌بندی یا ارسال..." /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border p-5 sm:p-7">
            <h2 className="text-sm font-black">روش ارسال</h2>
            <div className="mt-5 grid gap-2">
              {["پست پیشتاز", "تیپاکس", "تحویل حضوری"].map((method, index) => (
                <label key={method} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 text-xs font-bold has-[:checked]:border-ink has-[:checked]:bg-stone-50">
                  <input type="radio" value={method} {...register("shippingMethod")} defaultChecked={index === 0} className="accent-ink" />
                  <span>{method}</span><small className="mr-auto text-[9px] font-normal text-muted">{index === 2 ? "رایگان" : "۳ تا ۷ روز کاری"}</small>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border p-5 sm:p-7">
            <h2 className="text-sm font-black">روش پرداخت</h2>
            <label className="mt-5 flex items-center gap-3 rounded-xl border border-ink bg-stone-50 p-4 text-xs font-bold"><input type="radio" checked readOnly className="accent-ink" /><CreditCard className="size-5" />پرداخت اینترنتی امن</label>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-stone-50 p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="font-black">سفارش شما</h2>
          <ul className="mt-4 divide-y divide-border">
            {lines.map((line) => <li key={`${line.productId}-${line.size}-${line.color}`} className="flex justify-between gap-3 py-3 text-[10px]"><span className="line-clamp-2">{line.product.name} × {line.quantity}</span><strong className="shrink-0">{formatToman(line.total)}</strong></li>)}
          </ul>
          <dl className="mt-4 space-y-3 border-t border-border pt-4 text-xs">
            <div className="flex justify-between"><dt className="text-muted">جمع کالاها</dt><dd>{formatToman(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">ارسال</dt><dd>{shipping ? formatToman(shipping) : "رایگان"}</dd></div>
            {discount > 0 && <div className="flex justify-between text-brand"><dt>تخفیف {appliedCoupon}</dt><dd>- {formatToman(discount)}</dd></div>}
            <div className="flex justify-between border-t border-border pt-4 text-sm font-black"><dt>مبلغ پرداخت</dt><dd>{formatToman(total)}</dd></div>
          </dl>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>{isSubmitting ? "در حال ثبت سفارش..." : "پرداخت و ثبت سفارش"}</Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-[9px] text-muted"><ShieldCheck className="size-4" />پرداخت امن و حفاظت از اطلاعات شما</p>
        </aside>
      </form>
    </div>
  );
}
