"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpLeft, Flame, Heart, Menu, Search, ShoppingBag, Sparkles, UserRound, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { logoFallbackUrl, logoUrl } from "@/lib/assets";
import { toFa } from "@/lib/format";
import { resolveStorefrontCategories, type StorefrontCategory } from "@/lib/storefront-categories";
import { useStore } from "@/store/use-store";
import type { Product, StoreSettings } from "@/types/store";

function shopHref(q: string, category: string, sort: string) {
  return `/shop?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}`;
}

function CategoryLink({ category, className, onClick }: { category: StorefrontCategory; className: string; onClick?: () => void }) {
  const pathname = usePathname();
  if (category.categorySlug) {
    const href = `/category/${category.categorySlug}`;
    const active = pathname === href;
    return <Link href={href} className={`${className}${active ? " border-brand text-brand" : ""}`} onClick={onClick}>{category.label}</Link>;
  }
  return <Link href={shopHref(category.query || "", "", "newest")} className={className} onClick={onClick}>{category.label}</Link>;
}

export function Header({ products, settings }: { products: Product[]; settings: StoreSettings }) {
  const router = useRouter();
  const cart = useStore((state) => state.cart);
  const setCartOpen = useStore((state) => state.setCartOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const navigationItems = resolveStorefrontCategories(settings.navigationItems);
  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fa");
    if (!term) return products.filter((product) => product.active && product.featured).slice(0, 4);
    return products
      .filter((product) => product.active)
      .filter((product) => `${product.name} ${product.categoryName}`.toLocaleLowerCase("fa").includes(term))
      .slice(0, 4);
  }, [products, query]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    router.push(shopHref(query.trim(), "", "newest"));
    setSearchOpen(false);
  }

  return (
    <>
      {settings.announcementEnabled !== false && <div className="bg-brand px-4 py-2 text-center text-[10px] font-medium text-white sm:text-[11px]">
        <span className="inline-flex items-center gap-2"><Sparkles className="size-3 text-[#f2d9c9]" />{settings.announcement}</span>
      </div>}
      <header className="sticky top-0 z-40 border-b border-[#eadfd8] bg-[#fffdfb]/95 backdrop-blur-xl">
        <div className="container-site relative flex h-18 items-center gap-4 xl:h-21">
          <button
            type="button"
            className="grid size-10 place-items-center xl:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="باز کردن منو"
          >
            <Menu className="size-6" />
          </button>

          <Link href="/" className="shrink-0" aria-label="الون استایل">
            <span className="relative block h-11 w-30 sm:w-36 lg:h-14 lg:w-42">
              <Image
                src={logoUrl}
                alt="ELEVEN"
                fill
                sizes="(min-width: 1024px) 168px, (min-width: 640px) 144px, 120px"
                className="object-contain"
                priority
                onError={(event) => { event.currentTarget.src = logoFallbackUrl; }}
              />
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden h-full -translate-x-1/2 items-center justify-center gap-3 xl:flex 2xl:gap-5" aria-label="منوی اصلی">
            {navigationItems.map((category) => <CategoryLink key={category.label} category={category} className="flex h-full items-center whitespace-nowrap border-b-2 border-transparent text-[10px] font-bold transition hover:border-brand hover:text-brand 2xl:text-[11px]" />)}
          </nav>

          <div className="mr-auto flex items-center gap-0.5 xl:gap-1">
            <button type="button" className="header-icon-button" onClick={() => setSearchOpen(true)} aria-label="جستجو">
              <Search />
            </button>
            <Link href="/account" className="header-icon-button hidden sm:grid" aria-label="حساب کاربری">
              <UserRound />
            </Link>
            <Link href="/account" className="header-icon-button hidden sm:grid" aria-label="علاقه‌مندی‌ها">
              <Heart />
            </Link>
            <button type="button" className="header-icon-button relative" onClick={() => setCartOpen(true)} aria-label="سبد خرید">
              <ShoppingBag />
              {cartCount > 0 && (
                <span className="absolute left-0.5 top-0.5 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-brand px-1 text-[9px] font-black text-white">
                  {toFa(cartCount)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-60 bg-black/50 transition ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMenuOpen(false)}
      >
        <aside
          className={`h-full w-[310px] max-w-[86vw] bg-white p-5 shadow-2xl transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="relative block h-11 w-32">
              <Image src={logoUrl} alt="ELEVEN" fill sizes="128px" className="object-contain" />
            </span>
            <button type="button" className="grid size-9 place-items-center rounded-full bg-stone-100" onClick={() => setMenuOpen(false)} aria-label="بستن منو">
              <X className="size-5" />
            </button>
          </div>
          <nav className="mt-4 grid" aria-label="منوی موبایل">
            {navigationItems.map((category) => <CategoryLink key={category.label} category={category} className="border-b border-border py-3.5 text-[13px] font-bold" onClick={() => setMenuOpen(false)} />)}
            <Link href={shopHref("", "", "newest")} className="flex items-center justify-between border-b border-border py-3.5 text-[13px] font-black" onClick={() => setMenuOpen(false)}>تازه‌رسیده‌ها <Sparkles className="size-4 text-brand" /></Link>
            <Link href={shopHref("", "", "popular")} className="flex items-center justify-between border-b border-border py-3.5 text-[13px] font-black" onClick={() => setMenuOpen(false)}>پرفروش‌ها <Flame className="size-4 text-brand" /></Link>
            <Link href={shopHref("", "", "newest")} className="border-b border-border py-3.5 text-[13px] font-bold" onClick={() => setMenuOpen(false)}>همه محصولات</Link>
            <Link href="/tracking?code=" className="border-b border-border py-3.5 text-[13px] font-bold" onClick={() => setMenuOpen(false)}>پیگیری سفارش</Link>
            <Link href="/admin" className="mt-4 rounded-xl bg-ink px-4 py-3 text-center text-xs font-bold text-white" onClick={() => setMenuOpen(false)}>ورود به پنل مدیریت</Link>
          </nav>
        </aside>
      </div>

      <div className={`fixed inset-0 z-70 bg-black/62 transition ${searchOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setSearchOpen(false)}>
        <div className={`bg-white transition-transform duration-300 ${searchOpen ? "translate-y-0" : "-translate-y-full"}`} onClick={(event) => event.stopPropagation()}>
          <div className="container-site py-5 sm:py-8">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-[9px] font-black text-brand">جستجوی هوشمند</p><h2 className="mt-1 text-lg font-black sm:text-2xl">چی می‌خوای بپوشی؟</h2></div>
              <button type="button" onClick={() => setSearchOpen(false)} className="grid size-10 place-items-center border border-border" aria-label="بستن جستجو"><X className="size-5" /></button>
            </div>
            <form className="mt-5 flex border-b-2 border-ink" onSubmit={submitSearch}>
              <Search className="mt-4 size-5 shrink-0" />
              <input autoFocus={searchOpen} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="مثلاً پیراهن، شلوار بگ یا کتونی..." className="h-14 min-w-0 flex-1 border-0 bg-transparent px-4 text-sm outline-none sm:text-base" />
              <button type="submit" className="px-3 text-[11px] font-black sm:px-6">نمایش همه</button>
            </form>
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-black">{query.trim() ? "نتیجه‌های پیشنهادی" : "محبوب این روزها"}</p><span className="text-[9px] text-muted">{toFa(searchResults.length)} انتخاب</span></div>
              {searchResults.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {searchResults.map((product) => (
                    <Link key={product.id} href={`/product/${product.slug}`} onClick={() => setSearchOpen(false)} className="group flex min-w-0 gap-3 border border-border p-2 transition hover:border-ink">
                      <img src={product.images[0]} alt="" className="size-16 shrink-0 object-cover sm:size-20" />
                      <div className="min-w-0 self-center"><p className="truncate text-[10px] text-muted">{product.categoryName}</p><strong className="mt-1 line-clamp-2 text-[10px] leading-5 sm:text-[11px]">{product.name}</strong></div>
                      <ArrowUpLeft className="mr-auto mt-auto hidden size-4 shrink-0 sm:block" />
                    </Link>
                  ))}
                </div>
              ) : <p className="border border-dashed border-border py-8 text-center text-xs text-muted">چیزی با این عبارت پیدا نشد.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
