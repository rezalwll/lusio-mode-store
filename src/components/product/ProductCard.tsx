import { Link } from "@tanstack/react-router";
import { Heart, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { productPlaceholderUrl } from "@/lib/assets";
import { formatToman, toFa } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { Product } from "@/types/store";

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useStore((state) => state.addToCart);

  function quickAdd(size = product.sizes[0] || "فری‌سایز") {
    if (product.stock === 0) return;
    addToCart({
      productId: product.id,
      size,
      color: product.colors[0] || "پیش‌فرض",
      quantity: 1,
    });
    toast.success("به سبد خرید اضافه شد", { description: product.name });
  }

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="block size-full">
          <img
            src={product.images[0] || productPlaceholderUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition duration-700 group-hover:scale-[1.035]"
            onError={(event) => {
              event.currentTarget.src = productPlaceholderUrl;
            }}
          />
        </Link>

        <div className="absolute right-2.5 top-2.5 flex flex-col gap-2 opacity-0 translate-x-2 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 max-sm:opacity-100 max-sm:translate-x-0">
          <button
            type="button"
            aria-label="افزودن به علاقه‌مندی‌ها"
            className="grid size-9 place-items-center bg-white/95 shadow-sm backdrop-blur hover:text-brand"
          >
            <Heart className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => quickAdd()}
            disabled={product.stock === 0}
            aria-label="افزودن سریع به سبد"
            className="grid size-9 place-items-center bg-ink text-white shadow-sm backdrop-blur hover:bg-brand disabled:opacity-50"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {product.onSale && product.regularPrice > product.price && (
          <span className="absolute left-2.5 top-2.5 bg-brand px-2.5 py-1 text-[9px] font-black text-white">
            SALE
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 bg-white/92 px-3 py-2 text-xs font-bold backdrop-blur">
            <ShoppingBag className="size-4" /> ناموجود
          </div>
        )}
        {product.stock > 0 && product.sizes.length > 0 && (
          <div className="absolute inset-x-2.5 bottom-2.5 hidden translate-y-3 bg-white/96 p-2 opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
            <p className="mb-2 text-center text-[9px] font-bold text-muted">افزودن سریع · انتخاب سایز</p>
            <div className="flex flex-wrap justify-center gap-1">
              {product.sizes.slice(0, 6).map((size) => (
                <button key={size} type="button" onClick={() => quickAdd(size)} className="min-w-8 border border-border px-2 py-1.5 text-[9px] font-black transition hover:border-ink hover:bg-ink hover:text-white">{size}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-1 pt-3">
        <div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] text-muted">{product.categoryName}</p>{product.colors.length > 0 && <span className="shrink-0 text-[9px] text-muted">{toFa(product.colors.length)} رنگ</span>}</div>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="mt-1 line-clamp-2 min-h-11 text-[13px] font-bold leading-5 transition hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-black">{formatToman(product.price)}</span>
          {product.regularPrice > product.price && (
            <span className="text-[10px] text-muted line-through">{formatToman(product.regularPrice)}</span>
          )}
        </div>
        {product.stock > 0 && product.stock <= 4 && <p className="mt-2 text-[9px] font-bold text-brand">فقط {toFa(product.stock)} عدد باقی مانده</p>}
      </div>
    </article>
  );
}
