"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { productPlaceholderUrl } from "@/lib/assets";
import { formatToman, toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { Product } from "@/types/store";

export function MiniCart({ products }: { products: Product[] }) {
  const open = useStore((state) => state.cartOpen);
  const setOpen = useStore((state) => state.setCartOpen);
  const cart = useStore((state) => state.cart);
  const setQuantity = useStore((state) => state.setCartQuantity);
  const remove = useStore((state) => state.removeFromCart);
  const lines = useMemo(
    () => cart.flatMap((line) => {
      const product = products.find((item) => item.id === line.productId);
      return product ? [{ ...line, product, total: product.price * line.quantity }] : [];
    }),
    [cart, products],
  );
  const total = lines.reduce((sum, line) => sum + line.total, 0);

  return (
    <div className={`fixed inset-0 z-80 bg-black/45 transition ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)}>
      <aside className={`absolute inset-y-0 left-0 flex w-[410px] max-w-[92vw] flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`} onClick={(event) => event.stopPropagation()}>
        <div className="flex h-18 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2"><ShoppingBag className="size-5" /><h2 className="font-black">سبد خرید</h2><span className="text-xs text-muted">({toFa(lines.reduce((sum, line) => sum + line.quantity, 0))})</span></div>
          <button type="button" className="grid size-9 place-items-center rounded-full bg-stone-100" onClick={() => setOpen(false)} aria-label="بستن سبد"><X className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
              <span className="grid size-16 place-items-center rounded-full bg-stone-100"><ShoppingBag className="size-7 text-muted" /></span>
              <p className="mt-5 font-black">سبد خریدت خالی است</p>
              <p className="mt-1 text-xs text-muted">وقتشه چند انتخاب جذاب بهش اضافه کنی.</p>
              <Link href="/shop?q=&category=&sort=newest" onClick={() => setOpen(false)} className="mt-5 rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-white">رفتن به فروشگاه</Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <li key={`${line.productId}-${line.size}-${line.color}`} className="flex gap-3 py-4">
                  <img src={line.product.images[0] || productPlaceholderUrl} alt="" className="h-28 w-21 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${line.product.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-xs font-bold leading-5">{line.product.name}</Link>
                    <p className="mt-1 text-[10px] text-muted">سایز {line.size} · رنگ {line.color}</p>
                    <p className="mt-2 text-xs font-black">{formatToman(line.total)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center overflow-hidden rounded-lg border border-border">
                        <button type="button" className="grid size-7 place-items-center" onClick={() => setQuantity(line.productId, line.size, line.color, line.quantity - 1)}><Minus className="size-3" /></button>
                        <span className="min-w-7 text-center text-[11px]">{toFa(line.quantity)}</span>
                        <button type="button" className="grid size-7 place-items-center" onClick={() => setQuantity(line.productId, line.size, line.color, line.quantity + 1)}><Plus className="size-3" /></button>
                      </div>
                      <button type="button" className="grid size-8 place-items-center text-muted hover:text-brand" onClick={() => remove(line.productId, line.size, line.color)} aria-label="حذف"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {lines.length > 0 && (
          <div className="border-t border-border p-5">
            <div className="flex items-center justify-between"><span className="text-xs text-muted">مبلغ کل</span><strong className="text-base font-black">{formatToman(total)}</strong></div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={() => setOpen(false)} className="grid h-11 place-items-center rounded-xl border border-ink text-xs font-bold">مشاهده سبد</Link>
              <Link href="/checkout" onClick={() => setOpen(false)} className="grid h-11 place-items-center rounded-xl bg-brand text-xs font-bold text-white">تسویه حساب</Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
