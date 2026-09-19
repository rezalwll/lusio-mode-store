import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Download, Image, RotateCcw, Save, Settings2, Truck, Upload } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useStore, type StoreBackup } from "@/store/use-store";

const settingsSchema = z.object({
  storeName: z.string().min(2, "نام فروشگاه لازم است"),
  announcement: z.string().min(5, "متن نوار اطلاع‌رسانی کوتاه است"),
  supportPhone: z.string().min(8, "شماره تماس معتبر نیست"),
  address: z.string().min(10, "نشانی کامل لازم است"),
  instagram: z.string(),
  shippingCost: z.string().regex(/^\d+$/, "عدد معتبر وارد کنید"),
  freeShippingThreshold: z.string().regex(/^\d+$/, "عدد معتبر وارد کنید"),
  heroTitle: z.string().min(4, "عنوان اصلی لازم است"),
  heroSubtitle: z.string().min(8, "توضیح اصلی کوتاه است"),
  heroImage: z.url("نشانی تصویر معتبر نیست"),
  heroMobileImage: z.url("نشانی تصویر معتبر نیست"),
  heroEyebrow: z.string().min(3, "برچسب کوتاه است"),
  heroPrimaryCta: z.string().min(2, "متن دکمه لازم است"),
  storyTitle: z.string().min(8, "عنوان داستان کوتاه است"),
  editorialTitle: z.string().min(5, "عنوان ادیتوریال کوتاه است"),
  editorialText: z.string().min(10, "متن ادیتوریال کوتاه است"),
  showNewArrivals: z.boolean(),
  showCategories: z.boolean(),
  showEditorial: z.boolean(),
  showBestSellers: z.boolean(),
  monthlySalesTarget: z.string().regex(/^\d+$/, "عدد معتبر وارد کنید"),
});
type SettingsForm = z.infer<typeof settingsSchema>;

export function AdminSettingsPage() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const importBackup = useStore((state) => state.importBackup);
  const resetStore = useStore((state) => state.resetStore);
  const fileRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...settings,
      shippingCost: String(settings.shippingCost),
      freeShippingThreshold: String(settings.freeShippingThreshold),
      heroEyebrow: settings.heroEyebrow ?? "انتخاب تازه ادیتورها",
      heroPrimaryCta: settings.heroPrimaryCta ?? "خرید کالکشن",
      storyTitle: settings.storyTitle ?? "لباس‌هایی برای هر روز؛ جزئیاتی برای متفاوت‌بودن.",
      editorialTitle: settings.editorialTitle ?? "کمتر انتخاب کن، بهتر ست کن.",
      editorialText: settings.editorialText ?? "یک کمد حساب‌شده با رنگ‌های خنثی و برش‌های درست.",
      showNewArrivals: settings.showNewArrivals ?? true,
      showCategories: settings.showCategories ?? true,
      showEditorial: settings.showEditorial ?? true,
      showBestSellers: settings.showBestSellers ?? true,
      monthlySalesTarget: String(settings.monthlySalesTarget ?? 500_000_000),
    },
  });
  const heroImage = watch("heroImage");

  function submit(values: SettingsForm) { updateSettings({ ...values, shippingCost: Number(values.shippingCost), freeShippingThreshold: Number(values.freeShippingThreshold), monthlySalesTarget: Number(values.monthlySalesTarget) }); toast.success("تنظیمات فروشگاه ذخیره شد"); }
  function exportData() {
    const state = useStore.getState();
    const backup: StoreBackup = { products: state.products, categories: state.categories, orders: state.orders, customers: state.customers, coupons: state.coupons, settings: state.settings };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `eleven-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); toast.success("فایل پشتیبان آماده شد");
  }
  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const parsed = JSON.parse(await file.text()) as StoreBackup; if (!parsed || typeof parsed !== "object") throw new Error(); importBackup(parsed); toast.success("اطلاعات پشتیبان بازیابی شد"); }
    catch { toast.error("فایل پشتیبان معتبر نیست"); }
    event.target.value = "";
  }
  function reset() { if (window.confirm("تمام تغییرات مدیریتی پاک و داده‌های اولیه بازیابی شوند؟")) { resetStore(); toast.success("داده‌های اولیه بازیابی شدند"); } }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6"><div><p className="text-[10px] font-bold text-brand">کنترل کامل فروشگاه</p><h1 className="mt-1 text-2xl font-black">تنظیمات و محتوا</h1><p className="mt-1.5 text-[10px] text-muted">محتوای صفحه اصلی، اطلاعات تماس، ارسال و داده‌های فروشگاه را مدیریت کنید.</p></div>
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Settings2 className="size-5" /></span><div><h2 className="text-xs font-black">اطلاعات عمومی</h2><p className="mt-1 text-[9px] text-muted">نام، اطلاع‌رسانی و راه‌های ارتباطی</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="نام فروشگاه" error={errors.storeName?.message}><Input {...register("storeName")} /></Field><Field label="شماره پشتیبانی" error={errors.supportPhone?.message}><Input {...register("supportPhone")} dir="ltr" /></Field><Field label="متن نوار بالای سایت" error={errors.announcement?.message} className="sm:col-span-2"><Input {...register("announcement")} /></Field><Field label="نشانی فروشگاه" error={errors.address?.message} className="sm:col-span-2"><Textarea {...register("address")} rows={3} /></Field><Field label="نام کاربری اینستاگرام" error={errors.instagram?.message}><Input {...register("instagram")} dir="ltr" /></Field></div></section>
        <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-brand"><Image className="size-5" /></span><div><h2 className="text-xs font-black">محتوای صفحه اصلی</h2><p className="mt-1 text-[9px] text-muted">همه متن‌ها، تصاویر و بخش‌های ویترین فروشگاه</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="برچسب بالای عنوان" error={errors.heroEyebrow?.message}><Input {...register("heroEyebrow")} /></Field><Field label="متن دکمه اصلی" error={errors.heroPrimaryCta?.message}><Input {...register("heroPrimaryCta")} /></Field><Field label="عنوان اصلی" error={errors.heroTitle?.message} className="sm:col-span-2"><Input {...register("heroTitle")} /></Field><Field label="توضیح زیر عنوان" error={errors.heroSubtitle?.message} className="sm:col-span-2"><Textarea {...register("heroSubtitle")} rows={3} /></Field><Field label="عنوان داستان فصل" error={errors.storyTitle?.message} className="sm:col-span-2"><Input {...register("storyTitle")} /></Field><Field label="عنوان راهنمای استایل" error={errors.editorialTitle?.message}><Input {...register("editorialTitle")} /></Field><Field label="متن راهنمای استایل" error={errors.editorialText?.message}><Textarea {...register("editorialText")} rows={3} /></Field><Field label="تصویر دسکتاپ" error={errors.heroImage?.message}><Input {...register("heroImage")} dir="ltr" /></Field><Field label="تصویر موبایل" error={errors.heroMobileImage?.message}><Input {...register("heroMobileImage")} dir="ltr" /></Field><div className="grid gap-2 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-4">{[["showNewArrivals", "تازه‌رسیده‌ها"], ["showCategories", "دسته‌بندی تصویری"], ["showEditorial", "راهنمای استایل"], ["showBestSellers", "پرفروش‌ها"]].map(([name, label]) => <label key={name} className="flex items-center justify-between rounded-xl border border-border p-3 text-[9px] font-bold">{label}<input type="checkbox" {...register(name as "showNewArrivals" | "showCategories" | "showEditorial" | "showBestSellers")} className="size-4 accent-ink" /></label>)}</div>{heroImage && <div className="sm:col-span-2"><p className="mb-2 text-[9px] font-bold">پیش‌نمایش تصویر اصلی</p><img src={heroImage} alt="پیش‌نمایش بنر" className="max-h-64 w-full rounded-xl object-cover" /></div>}</div></section>
        <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Truck className="size-5" /></span><div><h2 className="text-xs font-black">ارسال سفارش‌ها</h2><p className="mt-1 text-[9px] text-muted">هزینه پایه و آستانه ارسال رایگان</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="هزینه ارسال (تومان)" error={errors.shippingCost?.message}><Input {...register("shippingCost")} inputMode="numeric" dir="ltr" /></Field><Field label="حداقل خرید برای ارسال رایگان" error={errors.freeShippingThreshold?.message}><Input {...register("freeShippingThreshold")} inputMode="numeric" dir="ltr" /></Field></div></section>
        <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Banknote className="size-5" /></span><div><h2 className="text-xs font-black">هدف فروش</h2><p className="mt-1 text-[9px] text-muted">هدف ماهانه‌ای که در داشبورد پایش می‌شود</p></div></div><div className="mt-6 max-w-md"><Field label="هدف فروش ماهانه (تومان)" error={errors.monthlySalesTarget?.message}><Input {...register("monthlySalesTarget")} inputMode="numeric" dir="ltr" /></Field></div></section>
        <div className="sticky bottom-4 flex justify-end"><Button type="submit" size="lg" className="shadow-xl"><Save className="size-4" />ذخیره همه تنظیمات</Button></div>
      </form>
      <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6"><div><h2 className="text-xs font-black">پشتیبان‌گیری و بازیابی</h2><p className="mt-1 text-[9px] text-muted">از محصولات، سفارش‌ها و تنظیمات یک نسخه JSON تهیه کنید یا نسخه قبلی را بازیابی کنید.</p></div><div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={exportData}><Download className="size-4" />دریافت پشتیبان</Button><Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="size-4" />بازیابی فایل</Button><input ref={fileRef} type="file" accept="application/json" onChange={importData} hidden /><Button variant="danger" onClick={reset}><RotateCcw className="size-4" />بازگشت به داده اولیه</Button></div></section>
    </div>
  );
}
