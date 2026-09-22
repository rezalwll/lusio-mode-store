import type { Product } from "@/types/store";
import { canonical } from "./site";

// Internal catalog prices are Toman (data declares currency_code IRT).
// Schema.org has no IRT currency, so structured data publishes IRR (Rial)
// with the numeric value converted exactly (x10). Never label an
// unconverted Toman number as IRR.
export const TOMAN_TO_RIAL = 10;
const TOMAN_TO_RIAL_BIGINT = 10n;

export function tomanToRial(toman: number): number {
  return Math.round(toman * TOMAN_TO_RIAL);
}

// Inverse used by database adapters (DB stores integer IRR as bigint).
// Only exact whole-Toman amounts convert: non-divisible or unsafe values
// throw instead of silently rounding or losing precision.
export function rialToToman(rial: bigint): number {
  if (rial % TOMAN_TO_RIAL_BIGINT !== 0n) {
    throw new Error(`Rial value is not an exact Toman amount: ${rial}`);
  }
  const toman = rial / TOMAN_TO_RIAL_BIGINT;
  if (toman > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Toman value exceeds safe integer range: ${rial}`);
  }
  return Number(toman);
}

export function availabilityFor(stock: number): "https://schema.org/InStock" | "https://schema.org/OutOfStock" {
  return stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export function breadcrumbItems(entries: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: canonical(entry.path),
    })),
  };
}

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    category: product.categoryName,
    ...(product.images[0] ? { image: product.images[0] } : {}),
    offers: {
      "@type": "Offer",
      url: canonical(`/product/${product.slug}`),
      priceCurrency: "IRR",
      price: tomanToRial(product.price),
      availability: availabilityFor(product.stock),
    },
  };
}
