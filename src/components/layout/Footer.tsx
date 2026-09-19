import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, Phone, Send } from "lucide-react";
import { logoFallbackUrl, logoUrl } from "@/lib/assets";
import { useStore } from "@/store/use-store";

export function Footer() {
  const settings = useStore((state) => state.settings);
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.25fr_.7fr_.7fr_1fr] lg:py-16">
        <div>
          <img
            src={logoUrl}
            alt="ELEVEN"
            className="h-14 w-40 brightness-0 invert"
            onError={(event) => { event.currentTarget.src = logoFallbackUrl; }}
          />
          <p className="mt-5 max-w-sm text-xs leading-7 text-white/55">
            در الون استایل، لباس فقط یک انتخاب نیست؛ بخشی از اعتمادبه‌نفس و سبک زندگی شماست. مجموعه‌ای منتخب از پوشاک مردانه با طراحی روز و کیفیت ماندگار.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-black">دسترسی سریع</h3>
          <div className="mt-4 grid gap-2.5 text-xs text-white/55">
            <Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="hover:text-white">فروشگاه</Link>
            <Link to="/tracking" search={{ code: "" }} className="hover:text-white">پیگیری سفارش</Link>
            <Link to="/account" className="hover:text-white">حساب کاربری</Link>
            <Link to="/cart" className="hover:text-white">سبد خرید</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black">راهنمای خرید</h3>
          <div className="mt-4 grid gap-2.5 text-xs text-white/55">
            <a href="#" className="hover:text-white">روش‌های ارسال</a>
            <a href="#" className="hover:text-white">شرایط بازگشت</a>
            <a href="#" className="hover:text-white">راهنمای انتخاب سایز</a>
            <a href="#" className="hover:text-white">سوالات متداول</a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black">با ما در ارتباط باشید</h3>
          <div className="mt-4 grid gap-3 text-xs text-white/60">
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-brand" />{settings.address}</p>
            <a href={`tel:${settings.supportPhone}`} className="flex items-center gap-2 hover:text-white"><Phone className="size-4 text-brand" />{settings.supportPhone}</a>
            <a href={`https://instagram.com/${settings.instagram}`} className="flex items-center gap-2 hover:text-white"><Instagram className="size-4 text-brand" />@{settings.instagram}</a>
          </div>
          <form className="mt-5 flex overflow-hidden rounded-xl border border-white/12 bg-white/5" onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="ایمیل شما" className="h-11 min-w-0 flex-1 bg-transparent px-3 text-xs outline-none placeholder:text-white/30" />
            <button type="submit" className="grid w-11 place-items-center bg-brand" aria-label="عضویت در خبرنامه"><Send className="size-4" /></button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/8">
        <div className="container-site flex flex-col gap-2 py-5 text-center text-[10px] text-white/40 sm:flex-row sm:justify-between sm:text-right">
          <span>© ۱۴۰۵ الون استایل؛ تمامی حقوق محفوظ است.</span>
          <span>تجربه‌ای مدرن برای خرید پوشاک مردانه</span>
        </div>
      </div>
    </footer>
  );
}
