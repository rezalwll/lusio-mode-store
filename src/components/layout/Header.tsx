import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { logoFallbackUrl, logoUrl } from "@/lib/assets";
import { toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";

const navSlugs = [
  "men-shirt",
  "men-pants",
  "men-t-shirts-and-sweatshirts",
  "men-shoes-and-boots",
  "men-accessories",
  "men-set",
];

export function Header() {
  const navigate = useNavigate();
  const categories = useStore((state) => state.categories);
  const cart = useStore((state) => state.cart);
  const settings = useStore((state) => state.settings);
  const setCartOpen = useStore((state) => state.setCartOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const navCategories = useMemo(
    () => navSlugs.map((slug) => categories.find((item) => item.slug === slug)).filter(Boolean),
    [categories],
  );

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    void navigate({ to: "/shop", search: { q: query.trim(), category: "", sort: "newest" } });
    setSearchOpen(false);
  }

  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-[10px] font-medium text-white sm:text-[11px]">
        {settings.announcement}
      </div>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl">
        <div className="container-site flex h-18 items-center gap-4 lg:h-21">
          <button
            type="button"
            className="grid size-10 place-items-center lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="باز کردن منو"
          >
            <Menu className="size-6" />
          </button>

          <Link to="/" className="shrink-0" aria-label="الون استایل">
            <img
              src={logoUrl}
              alt="ELEVEN"
              className="h-11 w-30 object-contain sm:w-36 lg:h-14 lg:w-42"
              onError={(event) => { event.currentTarget.src = logoFallbackUrl; }}
            />
          </Link>

          <nav className="mr-auto hidden items-center gap-5 xl:gap-7 lg:flex" aria-label="منوی اصلی">
            {navCategories.map((category) => category && (
              <Link
                key={category.slug}
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="whitespace-nowrap py-7 text-[12px] font-bold transition hover:text-brand xl:text-[13px]"
                activeProps={{ className: "text-brand" }}
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="mr-auto flex items-center gap-0.5 lg:mr-2 lg:gap-1">
            <button type="button" className="header-icon-button" onClick={() => setSearchOpen(true)} aria-label="جستجو">
              <Search />
            </button>
            <Link to="/account" className="header-icon-button hidden sm:grid" aria-label="حساب کاربری">
              <UserRound />
            </Link>
            <button type="button" className="header-icon-button hidden sm:grid" aria-label="علاقه‌مندی‌ها">
              <Heart />
            </button>
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
            <img src={logoUrl} alt="ELEVEN" className="h-11 w-32 object-contain" />
            <button type="button" className="grid size-9 place-items-center rounded-full bg-stone-100" onClick={() => setMenuOpen(false)} aria-label="بستن منو">
              <X className="size-5" />
            </button>
          </div>
          <nav className="mt-4 grid" aria-label="منوی موبایل">
            {navCategories.map((category) => category && (
              <Link
                key={category.slug}
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="border-b border-border py-3.5 text-[13px] font-bold"
                onClick={() => setMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            <Link to="/shop" search={{ q: "", category: "", sort: "newest" }} className="border-b border-border py-3.5 text-[13px] font-bold" onClick={() => setMenuOpen(false)}>همه محصولات</Link>
            <Link to="/tracking" className="border-b border-border py-3.5 text-[13px] font-bold" onClick={() => setMenuOpen(false)}>پیگیری سفارش</Link>
            <Link to="/admin" className="mt-4 rounded-xl bg-ink px-4 py-3 text-center text-xs font-bold text-white" onClick={() => setMenuOpen(false)}>ورود به پنل مدیریت</Link>
          </nav>
        </aside>
      </div>

      <div className={`fixed inset-0 z-70 grid place-items-start bg-black/65 px-4 pt-[16vh] transition ${searchOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setSearchOpen(false)}>
        <form className="mx-auto flex w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onSubmit={submitSearch} onClick={(event) => event.stopPropagation()}>
          <input autoFocus={searchOpen} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="دنبال چه محصولی هستی؟" className="h-16 min-w-0 flex-1 border-0 bg-transparent px-5 text-sm outline-none" />
          <button type="submit" className="grid w-16 place-items-center bg-brand text-white" aria-label="جستجو"><Search className="size-5" /></button>
        </form>
      </div>
    </>
  );
}
