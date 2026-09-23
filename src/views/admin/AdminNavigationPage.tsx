"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Menu, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Field";
import { storefrontCategories } from "@/lib/storefront-categories";
import { saveNavigationAction, saveStoreSettingsAction } from "@/server/actions/settings";
import type { Category, HomeSectionKey, StoreNavigationItem, StoreSettings } from "@/types/store";

const defaultNavigation: StoreNavigationItem[] = storefrontCategories.map((item, index) => ({
  id: `nav-${index + 1}`,
  label: item.label,
  mode: item.categorySlug ? "category" : "search",
  target: item.categorySlug || item.query || "",
  fallbackSlug: item.fallbackSlug,
  active: true,
}));

const sectionDefinitions: Array<{ id: HomeSectionKey; label: string; visibility?: keyof StoreSettings }> = [
  { id: "new", label: "تازه‌رسیده‌ها", visibility: "showNewArrivals" },
  { id: "sale", label: "تخفیف‌ها", visibility: "showSaleProducts" },
  { id: "categories", label: "دسته‌بندی‌های تصویری", visibility: "showCategories" },
  { id: "festival", label: "جشنواره", visibility: "showFestival" },
  { id: "editorial", label: "راهنمای استایل", visibility: "showEditorial" },
  { id: "best", label: "پرفروش‌ها", visibility: "showBestSellers" },
  { id: "trust", label: "مزیت‌های خرید" },
];

const defaultOrder = sectionDefinitions.map((item) => item.id);

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function AdminNavigationPage({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const router = useRouter();
  const [items, setItems] = useState<StoreNavigationItem[]>(() => settings.navigationItems ?? defaultNavigation);
  const [sectionOrder, setSectionOrder] = useState<HomeSectionKey[]>(() => {
    const saved = settings.homeSectionOrder ?? defaultOrder;
    return [...saved, ...defaultOrder.filter((item) => !saved.includes(item))];
  });
  const [visibility, setVisibility] = useState(() => ({
    showNewArrivals: settings.showNewArrivals !== false,
    showSaleProducts: settings.showSaleProducts !== false,
    showCategories: settings.showCategories !== false,
    showFestival: settings.showFestival !== false,
    showEditorial: settings.showEditorial !== false,
    showBestSellers: settings.showBestSellers !== false,
  }));

  function changeItem(id: string, changes: Partial<StoreNavigationItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  function addItem() {
    setItems((current) => [...current, { id: `nav-${Date.now()}`, label: "آیتم جدید", mode: "search", target: "", fallbackSlug: categories[0]?.slug || "men-shirt", active: true }]);
  }

  async function save() {
    if (items.some((item) => !item.label.trim() || !item.target.trim())) {
      toast.error("نام و مقصد همه آیتم‌های منو را کامل کنید");
      return;
    }
    try {
      await Promise.all([
        saveNavigationAction(items),
        saveStoreSettingsAction({ ...settings, navigationItems: items, homeSectionOrder: sectionOrder, ...visibility }),
      ]);
      router.refresh();
      toast.success("منو و چیدمان صفحه اصلی منتشر شد");
    } catch { toast.error("ذخیره چیدمان انجام نشد"); }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div><p className="text-[10px] font-bold text-brand">ساختار ویترین</p><h1 className="mt-1 text-2xl font-black">منو و چیدمان صفحه اصلی</h1><p className="mt-1.5 text-[10px] text-muted">لینک‌های منوی فروشگاه و ترتیب نمایش سکشن‌های صفحه خانه را بدون تغییر کد مدیریت کنید.</p></div>

      <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Menu className="size-5" /></span><div><h2 className="text-xs font-black">منوی اصلی فروشگاه</h2><p className="mt-1 text-[9px] text-muted">آیتم‌ها را فعال، حذف، اضافه یا جابه‌جا کنید.</p></div></div><Button variant="outline" size="sm" onClick={addItem}><Plus className="size-4" />افزودن آیتم</Button></div>
        <div className="mt-6 space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className={`grid gap-3 rounded-2xl border p-3 transition sm:grid-cols-[28px_1fr_150px_1fr_130px] sm:items-end ${item.active ? "border-border bg-white" : "border-dashed border-black/10 bg-stone-50 opacity-65"}`}>
              <GripVertical className="hidden size-4 self-center text-muted sm:block" />
              <label><span className="mb-1.5 block text-[9px] font-bold">عنوان منو</span><Input value={item.label} onChange={(event) => changeItem(item.id, { label: event.target.value })} /></label>
              <label><span className="mb-1.5 block text-[9px] font-bold">نوع مقصد</span><select value={item.mode} onChange={(event) => changeItem(item.id, { mode: event.target.value as StoreNavigationItem["mode"] })} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[10px] outline-none"><option value="category">دسته‌بندی</option><option value="search">عبارت جستجو</option></select></label>
              <label><span className="mb-1.5 block text-[9px] font-bold">{item.mode === "category" ? "اسلاگ دسته‌بندی" : "عبارت جستجو"}</span>{item.mode === "category" ? <select value={item.target} onChange={(event) => changeItem(item.id, { target: event.target.value, fallbackSlug: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[10px] outline-none"><option value={item.target}>{item.target}</option>{categories.filter((category) => category.slug !== item.target).map((category) => <option key={category.id} value={category.slug}>{category.name} — {category.slug}</option>)}</select> : <Input value={item.target} onChange={(event) => changeItem(item.id, { target: event.target.value })} />}</label>
              <div className="flex items-center justify-end gap-1 sm:h-11">
                <button type="button" onClick={() => setItems((current) => move(current, index, index - 1))} disabled={index === 0} className="grid size-9 place-items-center rounded-lg border border-border disabled:opacity-30" aria-label="انتقال به بالا"><ArrowUp className="size-4" /></button>
                <button type="button" onClick={() => setItems((current) => move(current, index, index + 1))} disabled={index === items.length - 1} className="grid size-9 place-items-center rounded-lg border border-border disabled:opacity-30" aria-label="انتقال به پایین"><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => changeItem(item.id, { active: !item.active })} className="grid size-9 place-items-center rounded-lg border border-border" aria-label={item.active ? "غیرفعال کردن" : "فعال کردن"}>{item.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
                <button type="button" onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))} className="grid size-9 place-items-center rounded-lg bg-rose-50 text-rose-700" aria-label="حذف"><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
        <div><h2 className="text-xs font-black">ترتیب بخش‌های صفحه اصلی</h2><p className="mt-1 text-[9px] text-muted">ترتیب را با فلش‌ها تغییر دهید و نمایش هر بخش را کنترل کنید.</p></div>
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {sectionOrder.map((id, index) => {
            const definition = sectionDefinitions.find((item) => item.id === id)!;
            const visible = definition.visibility ? visibility[definition.visibility as keyof typeof visibility] : true;
            return <div key={id} className={`flex items-center gap-3 rounded-xl border p-3 ${visible ? "border-border" : "border-dashed border-black/10 bg-stone-50 opacity-60"}`}><span className="grid size-7 place-items-center rounded-lg bg-stone-100 text-[10px] font-black">{index + 1}</span><strong className="text-[10px]">{definition.label}</strong><div className="mr-auto flex gap-1"><button type="button" onClick={() => setSectionOrder((current) => move(current, index, index - 1))} disabled={index === 0} className="grid size-8 place-items-center rounded-lg border border-border disabled:opacity-25"><ArrowUp className="size-3.5" /></button><button type="button" onClick={() => setSectionOrder((current) => move(current, index, index + 1))} disabled={index === sectionOrder.length - 1} className="grid size-8 place-items-center rounded-lg border border-border disabled:opacity-25"><ArrowDown className="size-3.5" /></button>{definition.visibility && <button type="button" onClick={() => setVisibility((current) => ({ ...current, [definition.visibility!]: !visible }))} className="grid size-8 place-items-center rounded-lg border border-border">{visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}</button>}</div></div>;
          })}
        </div>
      </section>

      <div className="sticky bottom-4 z-20 flex justify-end"><Button size="lg" onClick={save} className="shadow-xl"><Save className="size-4" />ذخیره و انتشار چیدمان</Button></div>
    </div>
  );
}
