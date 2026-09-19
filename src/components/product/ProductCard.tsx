import { Link } from "@tanstack/react-router";
import { Heart, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { productPlaceholderUrl } from "@/lib/assets";
import { formatToman } from "@/lib/format";
import { useStore } from "@/store/use-store";
import type { Product } from "@/types/store";

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useStore((state) => state.addToCart);

  function quickAdd() {
    if (product.stock === 0) return;
    addToCart({
      productId: product.id,
      size: product.sizes[0] || "فری‌سایز",
      color: product.colors[0] || "پیش‌فرض",
      quantity: 1,
    });
    toast.success("به سبد خرید اضافه شد", { description: product.name });
  }

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.35rem] bg-stone-100">
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

        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 translate-x-2 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 max-sm:opacity-100 max-sm:translate-x-0">
          <button
            type="button"
            aria-label="افزودن به علاقه‌مندی‌ها"
            className="grid size-9 place-items-center rounded-full bg-white/95 shadow-sm backdrop-blur hover:text-brand"
          >
            <Heart className="size-4" />
          </button>
          <button
            type="button"
            onClick={quickAdd}
            disabled={product.stock === 0}
            aria-label="افزودن سریع به سبد"
            className="grid size-9 place-items-center rounded-full bg-ink text-white shadow-sm backdrop-blur hover:bg-brand disabled:opacity-50"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {product.onSale && product.regularPrice > product.price && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-black text-white">
            فروش ویژه
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-xl bg-white/92 px-3 py-2 text-xs font-bold backdrop-blur">
            <ShoppingBag className="size-4" /> ناموجود
          </div>
        )}
      </div>

      <div className="px-1 pt-3">
        <p className="text-[11px] text-muted">{product.categoryName}</p>
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
      </div>
    </article>
  );
}
