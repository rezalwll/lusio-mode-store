import { useMemo } from "react";
import { useStore } from "@/store/use-store";

export function useCartLines() {
  const cart = useStore((state) => state.cart);
  const products = useStore((state) => state.products);
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
