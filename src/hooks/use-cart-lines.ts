import { useMemo } from "react";
import { useStore } from "@/store/use-store";
import type { Product } from "@/types/store";

export function useCartLines(products: Product[]) {
  const cart = useStore((state) => state.cart);
  const lines = useMemo(
    () => cart.flatMap((line) => {
      const product = products.find((item) => item.id === line.productId);
      return product ? [{ ...line, product, unitPrice: product.price, total: product.price * line.quantity }] : [];
    }),
    [cart, products],
  );
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  return { lines, subtotal, count };
}
