import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine } from "@/types/store";

interface StoreState {
  cart: CartLine[];
  appliedCoupon: string;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setAppliedCoupon: (code: string) => void;
  addToCart: (line: CartLine) => void;
  removeFromCart: (productId: number, size: string, color: string) => void;
  setCartQuantity: (productId: number, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  resetStore: () => void;
}

type PersistedStore = Pick<StoreState, "cart" | "appliedCoupon">;
const lineKey = (line: Pick<CartLine, "productId" | "size" | "color">) => `${line.productId}-${line.size}-${line.color}`;

function validCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((line) => {
    if (!line || typeof line !== "object") return [];
    const item = line as Partial<CartLine>;
    if (!Number.isSafeInteger(item.productId) || Number(item.productId) <= 0 || typeof item.size !== "string" || typeof item.color !== "string" || !Number.isSafeInteger(item.quantity) || Number(item.quantity) <= 0) return [];
    return [{ productId: Number(item.productId), size: item.size.slice(0, 80), color: item.color.slice(0, 80), quantity: Math.min(20, Number(item.quantity)) }];
  });
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [], appliedCoupon: "", cartOpen: false,
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setAppliedCoupon: (appliedCoupon) => set({ appliedCoupon: appliedCoupon.trim().toUpperCase() }),
      addToCart: (line) => set((state) => {
        const key = lineKey(line);
        const existing = state.cart.some((item) => lineKey(item) === key);
        return {
          cart: existing
            ? state.cart.map((item) => lineKey(item) === key ? { ...item, quantity: Math.min(20, item.quantity + Math.max(1, line.quantity)) } : item)
            : [...state.cart, { ...line, quantity: Math.min(20, Math.max(1, line.quantity)) }],
          cartOpen: true,
        };
      }),
      removeFromCart: (productId, size, color) => set((state) => ({ cart: state.cart.filter((item) => lineKey(item) !== lineKey({ productId, size, color })) })),
      setCartQuantity: (productId, size, color, quantity) => set((state) => ({ cart: state.cart.map((item) => lineKey(item) === lineKey({ productId, size, color }) ? { ...item, quantity: Math.min(20, Math.max(0, quantity)) } : item).filter((item) => item.quantity > 0) })),
      clearCart: () => set({ cart: [], appliedCoupon: "" }),
      resetStore: () => set({ cart: [], appliedCoupon: "", cartOpen: false }),
    }),
    {
      name: "lusio-mode-store-v2",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state): PersistedStore => ({ cart: state.cart, appliedCoupon: state.appliedCoupon }),
      migrate: (persisted): PersistedStore => {
        const old = persisted && typeof persisted === "object" ? persisted as { cart?: unknown; appliedCoupon?: unknown } : {};
        return { cart: validCart(old.cart), appliedCoupon: typeof old.appliedCoupon === "string" ? old.appliedCoupon.slice(0, 80).toUpperCase() : "" };
      },
    },
  ),
);
