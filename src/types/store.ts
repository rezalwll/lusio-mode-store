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
  status?: "published" | "draft" | "archived";
  metaTitle?: string;
  metaDescription?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
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
  internalNote?: string;
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

export interface StoreNavigationItem {
  id: string;
  label: string;
  mode: "category" | "search";
  target: string;
  fallbackSlug: string;
  active: boolean;
}

export type HomeSectionKey = "new" | "sale" | "categories" | "festival" | "editorial" | "best" | "trust";

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
  heroEyebrow?: string;
  heroPrimaryCta?: string;
  storyTitle?: string;
  editorialTitle?: string;
  editorialText?: string;
  showNewArrivals?: boolean;
  showCategories?: boolean;
  showEditorial?: boolean;
  showBestSellers?: boolean;
  showSaleProducts?: boolean;
  showFestival?: boolean;
  festivalEyebrow?: string;
  festivalTitle?: string;
  festivalSubtitle?: string;
  festivalImage?: string;
  monthlySalesTarget?: number;
  announcementEnabled?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  footerDescription?: string;
  footerCopyright?: string;
  footerTagline?: string;
  newArrivalsEyebrow?: string;
  newArrivalsTitle?: string;
  categoriesEyebrow?: string;
  categoriesTitle?: string;
  categoriesDescription?: string;
  saleEyebrow?: string;
  saleTitle?: string;
  editorialEyebrow?: string;
  editorialCta?: string;
  bestSellersEyebrow?: string;
  bestSellersTitle?: string;
  festivalCta?: string;
  relatedEyebrow?: string;
  relatedTitle?: string;
  trustShippingTitle?: string;
  trustShippingText?: string;
  trustReturnTitle?: string;
  trustReturnText?: string;
  trustQualityTitle?: string;
  trustQualityText?: string;
  trustSupportTitle?: string;
  trustSupportText?: string;
  themeBrand?: string;
  themeBrandDark?: string;
  themeInk?: string;
  themeBackground?: string;
  themeSurface?: string;
  themeBorder?: string;
  themeMint?: string;
  themeBlush?: string;
  lowStockThreshold?: number;
  navigationItems?: StoreNavigationItem[];
  homeSectionOrder?: HomeSectionKey[];
}
