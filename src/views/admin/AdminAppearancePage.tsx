"use client";

import { Eye, FileText, Palette, Save, Search, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useStore } from "@/store/use-store";
import type { StoreSettings } from "@/types/store";

const defaults = {
  announcementEnabled: true,
  seoTitle: "الون استایل | فروشگاه پوشاک مردانه",
  seoDescription: "خرید آنلاین پوشاک، کفش و اکسسوری مردانه از الون استایل با ارسال به سراسر ایران.",
  footerDescription: "در الون استایل، لباس فقط یک انتخاب نیست؛ بخشی از اعتمادبه‌نفس و سبک زندگی شماست.",
  footerCopyright: "© ۱۴۰۵ الون استایل؛ تمامی حقوق محفوظ است.",
  footerTagline: "تجربه‌ای مدرن برای خرید پوشاک مردانه",
  newArrivalsEyebrow: "JUST IN / تازه رسیده",
  newArrivalsTitle: "اولین نفر باش که می‌پوشد",
  categoriesEyebrow: "SHOP BY MOOD",
  categoriesTitle: "از حال‌وهوایت شروع کن",
  categoriesDescription: "دسته‌بندی‌هایی که هر کدام یک استایل کامل را می‌سازند.",
  saleEyebrow: "SALE / تخفیف‌های فعال",
  saleTitle: "انتخاب‌های خوش‌قیمت این هفته",
  editorialEyebrow: "راهنمای استایل",
  editorialCta: "دیدن این انتخاب",
  bestSellersEyebrow: "BEST SELLERS",
  bestSellersTitle: "انتخاب‌های امتحان‌پس‌داده",
  festivalCta: "ورود به جشنواره",
  relatedEyebrow: "پیشنهاد برای شما",
  relatedTitle: "محصولات مشابه",
  trustShippingTitle: "ارسال سریع",
  trustShippingText: "تحویل امن به سراسر ایران",
  trustReturnTitle: "ضمانت بازگشت",
  trustReturnText: "تا ۷ روز پس از تحویل",
  trustQualityTitle: "خرید مطمئن",
  trustQualityText: "تضمین اصالت و کیفیت کالا",
  trustSupportTitle: "پشتیبانی واقعی",
  trustSupportText: "همراه شما پیش و پس از خرید",
  themeBrand: "#8f4d59",
  themeBrandDark: "#6c3640",
  themeInk: "#2c2825",
  themeBackground: "#fffdfb",
  themeSurface: "#fbf7f3",
  themeBorder: "#e8d9cf",
  themeMint: "#b6dfd8",
  themeBlush: "#e8c7d7",
} satisfies Partial<StoreSettings>;

type Tab = "content" | "theme" | "seo";

function Panel({ title, description, icon, children }: { title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-brand">{icon}</span><div><h2 className="text-xs font-black">{title}</h2><p className="mt-1 text-[9px] text-muted">{description}</p></div></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-white focus-within:border-ink">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-full w-14 cursor-pointer border-0 bg-transparent p-1" />
        <input value={value} onChange={(event) => onChange(event.target.value)} dir="ltr" className="min-w-0 flex-1 border-0 px-3 font-mono text-xs uppercase outline-none" />
      </div>
    </Field>
  );
}

export function AdminAppearancePage() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const [tab, setTab] = useState<Tab>("content");
  const [draft, setDraft] = useState<StoreSettings>(() => ({ ...defaults, ...settings }));
  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));

  function save() {
    updateSettings(draft);
    toast.success("ظاهر و محتوای سایت منتشر شد");
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof FileText }> = [
    { id: "content", label: "متن‌های ویترین", icon: FileText },
    { id: "theme", label: "رنگ و هویت", icon: Palette },
    { id: "seo", label: "سئو و فوتر", icon: Search },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold text-brand">ویرایشگر زنده ویترین</p><h1 className="mt-1 text-2xl font-black">ظاهر و محتوای سایت</h1><p className="mt-1.5 text-[10px] text-muted">عنوان‌ها، توضیحات، رنگ‌های برند، سئو و متن‌های فوتر را از یک‌جا مدیریت کنید.</p></div><a href="/" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}><Eye className="size-4" />پیش‌نمایش فروشگاه</a></div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-black/5 bg-white p-1.5">
        {tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-[10px] font-black transition ${tab === item.id ? "bg-ink text-white" : "text-muted hover:bg-stone-100 hover:text-ink"}`}><item.icon className="size-4" />{item.label}</button>)}
      </div>

      {tab === "content" && <div className="space-y-5">
        <Panel title="نوار اطلاع‌رسانی و بنر اول" description="اولین پیام‌هایی که مشتری در فروشگاه می‌بیند" icon={<Sparkles className="size-5" />}>
          <label className="flex items-center justify-between rounded-xl border border-border p-3 text-[10px] font-bold sm:col-span-2">نمایش نوار اطلاع‌رسانی<input type="checkbox" checked={draft.announcementEnabled !== false} onChange={(event) => set("announcementEnabled", event.target.checked)} className="size-4 accent-ink" /></label>
          <Field label="متن نوار اطلاع‌رسانی" className="sm:col-span-2"><Input value={draft.announcement} onChange={(event) => set("announcement", event.target.value)} /></Field>
          <Field label="برچسب بالای بنر"><Input value={draft.heroEyebrow ?? ""} onChange={(event) => set("heroEyebrow", event.target.value)} /></Field>
          <Field label="متن دکمه بنر"><Input value={draft.heroPrimaryCta ?? ""} onChange={(event) => set("heroPrimaryCta", event.target.value)} /></Field>
          <Field label="عنوان بنر" className="sm:col-span-2"><Input value={draft.heroTitle} onChange={(event) => set("heroTitle", event.target.value)} /></Field>
          <Field label="توضیح بنر" className="sm:col-span-2"><Textarea rows={3} value={draft.heroSubtitle} onChange={(event) => set("heroSubtitle", event.target.value)} /></Field>
          <Field label="عنوان داستان فصل" className="sm:col-span-2"><Input value={draft.storyTitle ?? ""} onChange={(event) => set("storyTitle", event.target.value)} /></Field>
        </Panel>

        <Panel title="عنوان بخش‌های فروشگاه" description="تیتر و زیرتیتر تمام بخش‌های صفحه اصلی" icon={<FileText className="size-5" />}>
          <Field label="برچسب تازه‌رسیده‌ها"><Input value={draft.newArrivalsEyebrow ?? ""} onChange={(event) => set("newArrivalsEyebrow", event.target.value)} /></Field><Field label="عنوان تازه‌رسیده‌ها"><Input value={draft.newArrivalsTitle ?? ""} onChange={(event) => set("newArrivalsTitle", event.target.value)} /></Field>
          <Field label="برچسب دسته‌بندی‌ها"><Input value={draft.categoriesEyebrow ?? ""} onChange={(event) => set("categoriesEyebrow", event.target.value)} /></Field><Field label="عنوان دسته‌بندی‌ها"><Input value={draft.categoriesTitle ?? ""} onChange={(event) => set("categoriesTitle", event.target.value)} /></Field>
          <Field label="توضیح دسته‌بندی‌ها" className="sm:col-span-2"><Textarea rows={2} value={draft.categoriesDescription ?? ""} onChange={(event) => set("categoriesDescription", event.target.value)} /></Field>
          <Field label="برچسب تخفیف‌ها"><Input value={draft.saleEyebrow ?? ""} onChange={(event) => set("saleEyebrow", event.target.value)} /></Field><Field label="عنوان تخفیف‌ها"><Input value={draft.saleTitle ?? ""} onChange={(event) => set("saleTitle", event.target.value)} /></Field>
          <Field label="برچسب پرفروش‌ها"><Input value={draft.bestSellersEyebrow ?? ""} onChange={(event) => set("bestSellersEyebrow", event.target.value)} /></Field><Field label="عنوان پرفروش‌ها"><Input value={draft.bestSellersTitle ?? ""} onChange={(event) => set("bestSellersTitle", event.target.value)} /></Field>
          <Field label="برچسب راهنمای استایل"><Input value={draft.editorialEyebrow ?? ""} onChange={(event) => set("editorialEyebrow", event.target.value)} /></Field><Field label="متن دکمه راهنمای استایل"><Input value={draft.editorialCta ?? ""} onChange={(event) => set("editorialCta", event.target.value)} /></Field>
          <Field label="عنوان راهنمای استایل"><Input value={draft.editorialTitle ?? ""} onChange={(event) => set("editorialTitle", event.target.value)} /></Field><Field label="متن دکمه جشنواره"><Input value={draft.festivalCta ?? ""} onChange={(event) => set("festivalCta", event.target.value)} /></Field>
          <Field label="توضیح راهنمای استایل" className="sm:col-span-2"><Textarea rows={3} value={draft.editorialText ?? ""} onChange={(event) => set("editorialText", event.target.value)} /></Field>
          <Field label="برچسب محصولات مشابه"><Input value={draft.relatedEyebrow ?? ""} onChange={(event) => set("relatedEyebrow", event.target.value)} /></Field><Field label="عنوان محصولات مشابه"><Input value={draft.relatedTitle ?? ""} onChange={(event) => set("relatedTitle", event.target.value)} /></Field>
        </Panel>

        <Panel title="مزیت‌های خرید" description="چهار پیام اعتمادساز پایین صفحه اصلی" icon={<Sparkles className="size-5" />}>
          <Field label="عنوان مزیت ارسال"><Input value={draft.trustShippingTitle ?? ""} onChange={(event) => set("trustShippingTitle", event.target.value)} /></Field><Field label="توضیح مزیت ارسال"><Input value={draft.trustShippingText ?? ""} onChange={(event) => set("trustShippingText", event.target.value)} /></Field>
          <Field label="عنوان ضمانت بازگشت"><Input value={draft.trustReturnTitle ?? ""} onChange={(event) => set("trustReturnTitle", event.target.value)} /></Field><Field label="توضیح ضمانت بازگشت"><Input value={draft.trustReturnText ?? ""} onChange={(event) => set("trustReturnText", event.target.value)} /></Field>
          <Field label="عنوان خرید مطمئن"><Input value={draft.trustQualityTitle ?? ""} onChange={(event) => set("trustQualityTitle", event.target.value)} /></Field><Field label="توضیح خرید مطمئن"><Input value={draft.trustQualityText ?? ""} onChange={(event) => set("trustQualityText", event.target.value)} /></Field>
          <Field label="عنوان پشتیبانی"><Input value={draft.trustSupportTitle ?? ""} onChange={(event) => set("trustSupportTitle", event.target.value)} /></Field><Field label="توضیح پشتیبانی"><Input value={draft.trustSupportText ?? ""} onChange={(event) => set("trustSupportText", event.target.value)} /></Field>
        </Panel>
      </div>}

      {tab === "theme" && <div className="space-y-5">
        <Panel title="پالت رنگ فروشگاه" description="تغییرات رنگ بلافاصله روی تمام ویترین اعمال می‌شوند" icon={<Palette className="size-5" />}>
          <ColorField label="رنگ اصلی برند" value={draft.themeBrand ?? defaults.themeBrand} onChange={(value) => set("themeBrand", value)} />
          <ColorField label="رنگ تیره برند" value={draft.themeBrandDark ?? defaults.themeBrandDark} onChange={(value) => set("themeBrandDark", value)} />
          <ColorField label="رنگ متن اصلی" value={draft.themeInk ?? defaults.themeInk} onChange={(value) => set("themeInk", value)} />
          <ColorField label="پس‌زمینه سایت" value={draft.themeBackground ?? defaults.themeBackground} onChange={(value) => set("themeBackground", value)} />
          <ColorField label="سطح‌های روشن" value={draft.themeSurface ?? defaults.themeSurface} onChange={(value) => set("themeSurface", value)} />
          <ColorField label="خطوط و کادرها" value={draft.themeBorder ?? defaults.themeBorder} onChange={(value) => set("themeBorder", value)} />
          <ColorField label="رنگ پاستلی سبز" value={draft.themeMint ?? defaults.themeMint} onChange={(value) => set("themeMint", value)} />
          <ColorField label="رنگ پاستلی صورتی" value={draft.themeBlush ?? defaults.themeBlush} onChange={(value) => set("themeBlush", value)} />
          <div className="sm:col-span-2"><p className="mb-3 text-[11px] font-bold">پیش‌نمایش پالت</p><div className="grid h-24 grid-cols-4 overflow-hidden rounded-2xl border border-border"><span style={{ background: draft.themeBrand }} /><span style={{ background: draft.themeMint }} /><span style={{ background: draft.themeBlush }} /><span style={{ background: draft.themeInk }} /></div></div>
        </Panel>
      </div>}

      {tab === "seo" && <div className="space-y-5">
        <Panel title="سئوی صفحه اصلی" description="عنوان و توضیحی که در گوگل و تب مرورگر نمایش داده می‌شود" icon={<Search className="size-5" />}>
          <Field label="عنوان سئو" hint={`${(draft.seoTitle ?? "").length} کاراکتر`} className="sm:col-span-2"><Input value={draft.seoTitle ?? ""} onChange={(event) => set("seoTitle", event.target.value)} maxLength={65} /></Field>
          <Field label="توضیحات سئو" hint={`${(draft.seoDescription ?? "").length} کاراکتر`} className="sm:col-span-2"><Textarea rows={4} value={draft.seoDescription ?? ""} onChange={(event) => set("seoDescription", event.target.value)} maxLength={170} /></Field>
          <div className="rounded-2xl border border-border bg-[#fffdfb] p-4 sm:col-span-2" dir="rtl"><p className="truncate text-sm font-bold text-[#1a0dab]">{draft.seoTitle}</p><p className="mt-1 text-[10px] text-emerald-700" dir="ltr">elevenstyle.ir</p><p className="mt-1 line-clamp-2 text-[10px] leading-5 text-stone-600">{draft.seoDescription}</p></div>
        </Panel>
        <Panel title="متن‌های فوتر" description="معرفی برند و پیام‌های انتهای تمام صفحات" icon={<FileText className="size-5" />}>
          <Field label="توضیح برند" className="sm:col-span-2"><Textarea rows={4} value={draft.footerDescription ?? ""} onChange={(event) => set("footerDescription", event.target.value)} /></Field>
          <Field label="متن حق نشر"><Input value={draft.footerCopyright ?? ""} onChange={(event) => set("footerCopyright", event.target.value)} /></Field>
          <Field label="شعار پایین فوتر"><Input value={draft.footerTagline ?? ""} onChange={(event) => set("footerTagline", event.target.value)} /></Field>
        </Panel>
      </div>}

      <div className="sticky bottom-4 z-20 flex justify-end"><Button size="lg" onClick={save} className="shadow-xl"><Save className="size-4" />ذخیره و انتشار تغییرات</Button></div>
    </div>
  );
}
