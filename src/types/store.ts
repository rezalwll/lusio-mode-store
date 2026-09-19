export interface Product {
  id: number;
  slug: string;
  name: string;
  sku: string;
  category: string;
  categoryName: string;
  categorySlugs: string[];
  price: number;
  regularPrice: number;
  onSale: boolean;
  images: string[];
  colors: string[];
  sizes: string[];
  stock: number;
  active: boolean;
  featured: boolean;
  description: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  parent: number;
  image: string;
  active: boolean;
}

export interface CartLine {
  productId: number;
  size: string;
  color: string;
  quantity: number;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "refunded";

export interface Order {
  id: string;
  customerId: number;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingMethod: string;
  trackingCode?: string;
  items: Array<CartLine & { name: string; price: number }>;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  joinedAt: string;
  active: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  usageLimit: number;
  used: number;
  expiresAt: string;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  announcement: string;
  supportPhone: string;
  address: string;
  shippingCost: number;
  freeShippingThreshold: number;
  instagram: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroMobileImage: string;
}
