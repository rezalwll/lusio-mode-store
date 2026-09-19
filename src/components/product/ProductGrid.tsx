import { PackageSearch } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/store";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="col-span-full flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-stone-50 text-center">
        <PackageSearch className="size-10 text-muted" />
        <p className="mt-4 font-black">محصولی پیدا نشد</p>
        <p className="mt-1 text-xs text-muted">فیلترها یا عبارت جستجو را تغییر دهید.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-5">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
