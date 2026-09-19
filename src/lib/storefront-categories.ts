import type { Product, StoreNavigationItem } from "@/types/store";

export interface StorefrontCategory {
  label: string;
  categorySlug?: string;
  query?: string;
  fallbackSlug: string;
}

export const storefrontCategories: StorefrontCategory[] = [
  { label: "تیشرت", categorySlug: "tshirt", query: "تیشرت", fallbackSlug: "men-t-shirts-and-sweatshirts" },
  { label: "شلوار اسلش", query: "اسلش", fallbackSlug: "men-pants" },
  { label: "شلوار مام فیت", query: "مام", fallbackSlug: "men-pants" },
  { label: "شلوار بگ", query: "بگ", fallbackSlug: "men-pants" },
  { label: "هودی و سوییشرت", categorySlug: "men-sweatshirts-and-hoodies", query: "هودی", fallbackSlug: "men-sweatshirts-and-hoodies" },
  { label: "ست مردانه", categorySlug: "men-set", query: "ست", fallbackSlug: "men-set" },
  { label: "کتونی", categorySlug: "men-shoes-and-boots", query: "کتونی", fallbackSlug: "men-shoes-and-boots" },
  { label: "دورس", query: "دورس", fallbackSlug: "men-sweatshirts-and-hoodies" },
];

export function resolveStorefrontCategories(items?: StoreNavigationItem[]) {
  if (!items) return storefrontCategories;
  return items.filter((item) => item.active).map((item) => ({
    label: item.label,
    categorySlug: item.mode === "category" ? item.target : undefined,
    query: item.mode === "search" ? item.target : undefined,
    fallbackSlug: item.fallbackSlug,
  }));
}

export function matchesStorefrontCategory(product: Product, category: StorefrontCategory) {
  if (category.categorySlug && (product.category === category.categorySlug || product.categorySlugs.includes(category.categorySlug))) return true;
  const query = category.query?.toLocaleLowerCase("fa");
  return Boolean(query && `${product.name} ${product.categoryName}`.toLocaleLowerCase("fa").includes(query));
}
