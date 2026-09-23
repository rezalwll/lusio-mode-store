import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { initialCategories, initialProducts } from "@/lib/catalog";
import { defaultStoreSettings } from "@/lib/store-defaults";
import type {
  CartLine,
  Category,
  Coupon,
  Customer,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
} from "@/types/store";

const initialOrders: Order[] = [
  {
    id: "EL-10248",
    customerId: 1,
    customerName: "آرین محمدی",
    phone: "09123458712",
    city: "تهران",
    address: "خیابان ولیعصر، کوچه یاس",
    postalCode: "1435763811",
    createdAt: "2026-09-19T09:10:00.000Z",
    total: 4_480_000,
    status: "processing",
    paymentStatus: "paid",
    shippingMethod: "پست پیشتاز",
    items: [{ productId: initialProducts[0]?.id ?? 1, name: initialProducts[0]?.name ?? "محصول", price: 2_240_000, quantity: 2, size: "XL", color: "مشکی" }],
  },
  {
    id: "EL-10247",
    customerId: 2,
    customerName: "سامیار احمدی",
    phone: "09357801142",
    city: "کرج",
    address: "گوهردشت، بلوار اصلی",
    postalCode: "3198741265",
    createdAt: "2026-09-19T07:45:00.000Z",
    total: 1_490_000,
    status: "pending",
    paymentStatus: "paid",
    shippingMethod: "پست پیشتاز",
    items: [{ productId: initialProducts[1]?.id ?? 2, name: initialProducts[1]?.name ?? "محصول", price: 1_490_000, quantity: 1, size: "L", color: "سفید" }],
  },
  {
    id: "EL-10246",
    customerId: 3,
    customerName: "کیان رستمی",
    phone: "09172219800",
    city: "شیراز",
    address: "بلوار چمران",
    postalCode: "7185642180",
    createdAt: "2026-09-18T15:35:00.000Z",
    total: 3_680_000,
    status: "shipped",
    paymentStatus: "paid",
    shippingMethod: "تیپاکس",
    trackingCode: "TIP-843291",
    items: [{ productId: initialProducts[2]?.id ?? 3, name: initialProducts[2]?.name ?? "محصول", price: 1_840_000, quantity: 2, size: "42", color: "سرمه‌ای" }],
  },
  {
    id: "EL-10245",
    customerId: 4,
    customerName: "پارسا کریمی",
    phone: "09148803210",
    city: "تبریز",
    address: "ولیعصر جنوبی",
    postalCode: "5137789654",
    createdAt: "2026-09-18T12:00:00.000Z",
    total: 2_290_000,
    status: "delivered",
    paymentStatus: "paid",
    shippingMethod: "پست پیشتاز",
    trackingCode: "POST-118432",
    items: [{ productId: initialProducts[3]?.id ?? 4, name: initialProducts[3]?.name ?? "محصول", price: 2_290_000, quantity: 1, size: "XL", color: "کرم" }],
  },
  {
    id: "EL-10244",
    customerId: 5,
    customerName: "محمدطاها یوسفی",
    phone: "09139014477",
    city: "اصفهان",
    address: "چهارباغ بالا",
    postalCode: "8174682531",
    createdAt: "2026-09-17T18:40:00.000Z",
    total: 5_970_000,
    status: "delivered",
    paymentStatus: "paid",
    shippingMethod: "تیپاکس",
    items: [{ productId: initialProducts[4]?.id ?? 5, name: initialProducts[4]?.name ?? "محصول", price: 1_990_000, quantity: 3, size: "L", color: "مشکی" }],
  },
  {
    id: "EL-10243",
    customerId: 6,
    customerName: "ماهان قاسمی",
    phone: "09913226711",
    city: "رشت",
    address: "گلسار",
    postalCode: "4157612398",
    createdAt: "2026-09-17T14:55:00.000Z",
    total: 890_000,
    status: "cancelled",
    paymentStatus: "refunded",
    shippingMethod: "پست پیشتاز",
    items: [{ productId: initialProducts[5]?.id ?? 6, name: initialProducts[5]?.name ?? "محصول", price: 890_000, quantity: 1, size: "M", color: "مشکی" }],
  },
];

const initialCustomers: Customer[] = [
  { id: 1, name: "آرین محمدی", phone: "09123458712", email: "arian@example.com", city: "تهران", ordersCount: 8, totalSpent: 18_420_000, joinedAt: "۱۴۰۵/۰۲/۱۲", active: true },
  { id: 2, name: "سامیار احمدی", phone: "09357801142", email: "samyar@example.com", city: "کرج", ordersCount: 4, totalSpent: 7_980_000, joinedAt: "۱۴۰۵/۰۳/۰۵", active: true },
  { id: 3, name: "کیان رستمی", phone: "09172219800", email: "kian@example.com", city: "شیراز", ordersCount: 6, totalSpent: 13_760_000, joinedAt: "۱۴۰۵/۰۱/۲۸", active: true },
  { id: 4, name: "پارسا کریمی", phone: "09148803210", email: "parsa@example.com", city: "تبریز", ordersCount: 3, totalSpent: 5_420_000, joinedAt: "۱۴۰۵/۰۴/۱۴", active: true },
  { id: 5, name: "محمدطاها یوسفی", phone: "09139014477", email: "taha@example.com", city: "اصفهان", ordersCount: 11, totalSpent: 29_840_000, joinedAt: "۱۴۰۴/۱۱/۰۲", active: true },
  { id: 6, name: "ماهان قاسمی", phone: "09913226711", email: "mahan@example.com", city: "رشت", ordersCount: 2, totalSpent: 2_180_000, joinedAt: "۱۴۰۵/۰۵/۲۱", active: false },
];

const initialCoupons: Coupon[] = [
  { id: 1, code: "ELEVEN10", type: "percent", value: 10, minOrder: 1_500_000, usageLimit: 200, used: 68, expiresAt: "2026-12-20", active: true },
  { id: 2, code: "FIRSTBUY", type: "fixed", value: 300_000, minOrder: 2_000_000, usageLimit: 500, used: 143, expiresAt: "2027-01-01", active: true },
  { id: 3, code: "SUMMER20", type: "percent", value: 20, minOrder: 3_000_000, usageLimit: 100, used: 100, expiresAt: "2026-09-01", active: false },
];

const initialSettings: StoreSettings = defaultStoreSettings;

interface CheckoutInput {
  customerName: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  shippingMethod: string;
  total: number;
}

export interface StoreBackup {
  products?: Product[];
  categories?: Category[];
  orders?: Order[];
  customers?: Customer[];
  coupons?: Coupon[];
  settings?: StoreSettings;
}

interface StoreState {
  products: Product[];
  categories: Category[];
  cart: CartLine[];
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  settings: StoreSettings;
  appliedCoupon: string;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setAppliedCoupon: (code: string) => void;
  addToCart: (line: CartLine) => void;
  removeFromCart: (productId: number, size: string, color: string) => void;
  setCartQuantity: (productId: number, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  toggleProduct: (id: number) => void;
  saveCategory: (category: Category) => void;
  deleteCategory: (id: number) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrder: (id: string, changes: Partial<Order>) => void;
  placeOrder: (input: CheckoutInput) => string;
  saveCustomer: (customer: Customer) => void;
  toggleCustomer: (id: number) => void;
  saveCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: number) => void;
  updateSettings: (settings: Partial<StoreSettings>) => void;
  importBackup: (backup: StoreBackup) => void;
  resetStore: () => void;
}

const lineKey = (line: Pick<CartLine, "productId" | "size" | "color">) =>
  `${line.productId}-${line.size}-${line.color}`;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      categories: initialCategories,
      cart: [],
      orders: initialOrders,
      customers: initialCustomers,
      coupons: initialCoupons,
      settings: initialSettings,
      appliedCoupon: "",
      cartOpen: false,
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setAppliedCoupon: (appliedCoupon) => set({ appliedCoupon }),
      addToCart: (line) => {
        set((state) => {
          const key = lineKey(line);
          const exists = state.cart.find((item) => lineKey(item) === key);
          const product = state.products.find((item) => item.id === line.productId);
          const variant = product?.variants?.find((item) => item.size === line.size && item.color === line.color);
          const available = product?.variants?.length ? (variant?.stock ?? 0) : (product?.stock ?? 0);
          if (available <= 0) return state;
          return {
            cart: exists
              ? state.cart.map((item) =>
                  lineKey(item) === key ? { ...item, quantity: Math.min(available, item.quantity + line.quantity) } : item,
                )
              : [...state.cart, { ...line, quantity: Math.min(available, line.quantity) }],
            cartOpen: true,
          };
        });
      },
      removeFromCart: (productId, size, color) =>
        set((state) => ({ cart: state.cart.filter((item) => lineKey(item) !== lineKey({ productId, size, color })) })),
      setCartQuantity: (productId, size, color, quantity) =>
        set((state) => {
          const product = state.products.find((item) => item.id === productId);
          const variant = product?.variants?.find((item) => item.size === size && item.color === color);
          const available = product?.variants?.length ? (variant?.stock ?? 0) : (product?.stock ?? 0);
          return { cart: state.cart
            .map((item) =>
              lineKey(item) === lineKey({ productId, size, color })
                ? { ...item, quantity: Math.min(available, Math.max(0, quantity)) }
                : item,
            )
            .filter((item) => item.quantity > 0),
          };
        }),
      clearCart: () => set({ cart: [], appliedCoupon: "" }),
      saveProduct: (product) =>
        set((state) => ({
          products: state.products.some((item) => item.id === product.id)
            ? state.products.map((item) => (item.id === product.id ? product : item))
            : [product, ...state.products],
        })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter((item) => item.id !== id) })),
      toggleProduct: (id) =>
        set((state) => ({ products: state.products.map((item) => (item.id === id ? { ...item, active: !item.active } : item)) })),
      saveCategory: (category) =>
        set((state) => ({
          categories: state.categories.some((item) => item.id === category.id)
            ? state.categories.map((item) => (item.id === category.id ? category : item))
            : [category, ...state.categories],
          products: state.products.map((product) =>
            product.category === category.slug ? { ...product, categoryName: category.name } : product,
          ),
        })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter((item) => item.id !== id) })),
      updateOrderStatus: (id, status) =>
        set((state) => ({ orders: state.orders.map((order) => (order.id === id ? { ...order, status } : order)) })),
      updateOrder: (id, changes) =>
        set((state) => ({ orders: state.orders.map((order) => (order.id === id ? { ...order, ...changes } : order)) })),
      placeOrder: (input) => {
        const state = get();
        const numericIds = state.orders.map((order) => Number(order.id.replace(/\D/g, ""))).filter(Boolean);
        const id = `EL-${Math.max(10248, ...numericIds) + 1}`;
        const customer = state.customers.find((item) => item.phone === input.phone);
        const customerId = customer?.id ?? Math.max(0, ...state.customers.map((item) => item.id)) + 1;
        const items = state.cart.flatMap((line) => {
          const product = state.products.find((item) => item.id === line.productId);
          return product ? [{ ...line, name: product.name, price: product.price }] : [];
        });
        const order: Order = {
          id,
          customerId,
          customerName: input.customerName,
          phone: input.phone,
          city: input.city,
          address: input.address,
          postalCode: input.postalCode,
          createdAt: new Date().toISOString(),
          total: input.total,
          status: "pending",
          paymentStatus: "paid",
          shippingMethod: input.shippingMethod,
          items,
        };
        const nextCustomer: Customer = customer
          ? { ...customer, ordersCount: customer.ordersCount + 1, totalSpent: customer.totalSpent + input.total }
          : { id: customerId, name: input.customerName, phone: input.phone, email: "", city: input.city, ordersCount: 1, totalSpent: input.total, joinedAt: new Intl.DateTimeFormat("fa-IR").format(new Date()), active: true };
        set({
          orders: [order, ...state.orders],
          customers: customer
            ? state.customers.map((item) => (item.id === customer.id ? nextCustomer : item))
            : [nextCustomer, ...state.customers],
          products: state.products.map((product) => {
            const lines = state.cart.filter((item) => item.productId === product.id);
            if (!lines.length) return product;
            const sold = lines.reduce((sum, line) => sum + line.quantity, 0);
            const variants = product.variants?.map((variant) => {
              const line = lines.find((item) => item.size === variant.size && item.color === variant.color);
              return line ? { ...variant, stock: Math.max(0, variant.stock - line.quantity) } : variant;
            });
            return { ...product, stock: Math.max(0, product.stock - sold), variants };
          }),
          cart: [],
          appliedCoupon: "",
        });
        return id;
      },
      saveCustomer: (customer) =>
        set((state) => ({
          customers: state.customers.some((item) => item.id === customer.id)
            ? state.customers.map((item) => (item.id === customer.id ? customer : item))
            : [customer, ...state.customers],
        })),
      toggleCustomer: (id) =>
        set((state) => ({ customers: state.customers.map((item) => (item.id === id ? { ...item, active: !item.active } : item)) })),
      saveCoupon: (coupon) =>
        set((state) => ({
          coupons: state.coupons.some((item) => item.id === coupon.id)
            ? state.coupons.map((item) => (item.id === coupon.id ? coupon : item))
            : [coupon, ...state.coupons],
        })),
      deleteCoupon: (id) => set((state) => ({ coupons: state.coupons.filter((item) => item.id !== id) })),
      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      importBackup: (backup) =>
        set((state) => ({
          products: Array.isArray(backup.products) ? backup.products : state.products,
          categories: Array.isArray(backup.categories) ? backup.categories : state.categories,
          orders: Array.isArray(backup.orders) ? backup.orders : state.orders,
          customers: Array.isArray(backup.customers) ? backup.customers : state.customers,
          coupons: Array.isArray(backup.coupons) ? backup.coupons : state.coupons,
          settings: backup.settings && typeof backup.settings === "object" ? { ...state.settings, ...backup.settings } : state.settings,
        })),
      resetStore: () =>
        set({
          products: initialProducts,
          categories: initialCategories,
          cart: [],
          orders: initialOrders,
          customers: initialCustomers,
          coupons: initialCoupons,
          settings: initialSettings,
          appliedCoupon: "",
        }),
    }),
    {
      name: "lusio-mode-store-v2",
      storage: createJSONStorage(() => localStorage),
      // SSR-safe: never auto-hydrate persisted browser state before the first
      // client render (server HTML uses default state). Providers rehydrate
      // explicitly in an effect after mount; see app/providers.tsx.
      skipHydration: true,
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        cart: state.cart,
        orders: state.orders,
        customers: state.customers,
        coupons: state.coupons,
        settings: state.settings,
        appliedCoupon: state.appliedCoupon,
      }),
    },
  ),
);
