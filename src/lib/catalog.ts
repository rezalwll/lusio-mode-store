import rawProducts from "../../assets/data/store-products.json";
import rawProductsExtra from "../../assets/data/store-products-2.json";
import rawCategories from "../../assets/data/store-categories.json";
import type { Category, Product } from "@/types/store";

type RawImage = { src?: string };
type RawTerm = { name?: string };
type RawAttribute = { name?: string; terms?: RawTerm[] };
type RawCategoryRef = { slug?: string; name?: string };
type RawProduct = {
  id?: number;
  name?: string;
  slug?: string;
  sku?: string;
  short_description?: string;
  description?: string;
  on_sale?: boolean;
  is_in_stock?: boolean;
  low_stock_remaining?: number | null;
  prices?: { price?: string; regular_price?: string; sale_price?: string };
  images?: RawImage[];
  categories?: RawCategoryRef[];
  attributes?: RawAttribute[];
};
type RawCategory = {
  id?: number;
  name?: string;
  slug?: string;
  description?: string;
  parent?: number;
  image?: { src?: string } | null;
};

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const priceOf = (item: RawProduct) =>
  Number(item.prices?.price || item.prices?.sale_price || item.prices?.regular_price || 0);
const regularPriceOf = (item: RawProduct) =>
  Number(item.prices?.regular_price || item.prices?.price || item.prices?.sale_price || 0);

const allRawProducts = [...(rawProducts as RawProduct[]), ...(rawProductsExtra as RawProduct[])];
const seen = new Set<number>();

export const initialProducts: Product[] = allRawProducts
  .filter((item) => {
    const id = Number(item.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  })
  .map((item, index) => {
    const fallbackCategory = /(shirt|crop|modal|diplomat|basell|par[ie]|cotton|classic)/i.test(
      `${item.slug} ${item.name}`,
    )
      ? { slug: "men-shirt", name: "پیراهن مردانه" }
      : undefined;
    const category = item.categories?.[0] ?? fallbackCategory;
    const colorAttribute = item.attributes?.find((attribute) => attribute.name === "رنگ");
    const sizeAttribute = item.attributes?.find((attribute) => attribute.name === "اندازه");
    const price = priceOf(item) || regularPriceOf(item);

    return {
      id: Number(item.id),
      slug: item.slug || `product-${item.id}`,
      name: item.name || "محصول بدون نام",
      sku: item.sku || `ELV-${String(index + 1).padStart(4, "0")}`,
      category: category?.slug || "uncategorized",
      categoryName: category?.name || "بدون دسته‌بندی",
      categorySlugs: [...new Set((item.categories || []).map((entry) => entry.slug).filter(Boolean))] as string[],
      price,
      regularPrice: regularPriceOf(item) || price,
      onSale: Boolean(item.on_sale),
      images: [...new Set((item.images || []).map((image) => image.src).filter(Boolean))] as string[],
      colors: (colorAttribute?.terms || []).map((term) => term.name).filter(Boolean) as string[],
      sizes: (sizeAttribute?.terms || []).map((term) => term.name).filter(Boolean) as string[],
      stock: item.is_in_stock === false ? 0 : Math.max(1, Number(item.low_stock_remaining) || 12 + (index % 19)),
      active: true,
      featured: index < 12,
      description:
        stripHtml(item.short_description || item.description || "") ||
        "محصولی با طراحی به‌روز و کیفیت مناسب برای استایل روزمره.",
    };
  });

export const initialCategories: Category[] = (rawCategories as RawCategory[]).map((item) => ({
  id: Number(item.id),
  slug: item.slug || `category-${item.id}`,
  name: item.name || "بدون نام",
  description: item.description || "",
  parent: Number(item.parent || 0),
  image: item.image?.src || "",
  active: true,
}));
