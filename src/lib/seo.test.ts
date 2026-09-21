import { describe, expect, it } from "vitest";
import { availabilityFor, breadcrumbItems, productJsonLd, tomanToRial } from "@/lib/structured-data";
import { canonical, SITE_ORIGIN } from "@/lib/site";
import type { Product } from "@/types/store";

const sample: Product = {
  id: 19276,
  slug: "vans-dior",
  name: "Vans Dior الون",
  sku: "ELV-0001",
  category: "men-shoes-and-boots",
  categoryName: "کتونی و کفش مردانه",
  categorySlugs: ["men-shoes-and-boots"],
  price: 2_498_000,
  regularPrice: 2_498_000,
  onSale: false,
  images: ["https://elevenstyle.ir/wp-content/uploads/2026/09/Vans-Dior-blue.webp"],
  colors: [],
  sizes: [],
  stock: 12,
  active: true,
  featured: true,
  description: "توضیح آزمایشی",
};

describe("canonical", () => {
  it("builds absolute URLs from the shared site origin", () => {
    expect(canonical("/product/vans-dior")).toBe(`${SITE_ORIGIN}/product/vans-dior`);
    expect(canonical("shop")).toBe(`${SITE_ORIGIN}/shop`);
    expect(SITE_ORIGIN).toBe("https://elevenstyle.ir");
  });
});

describe("tomanToRial", () => {
  it("converts Toman to Rials exactly (x10) for IRR structured data", () => {
    expect(tomanToRial(2_498_000)).toBe(24_980_000);
    expect(tomanToRial(0)).toBe(0);
    expect(tomanToRial(1)).toBe(10);
  });
});

describe("availabilityFor", () => {
  it("maps positive stock to InStock and zero to OutOfStock", () => {
    expect(availabilityFor(12)).toBe("https://schema.org/InStock");
    expect(availabilityFor(0)).toBe("https://schema.org/OutOfStock");
  });
});

describe("productJsonLd", () => {
  it("publishes converted IRR pricing, never a Toman number as IRR", () => {
    const json = productJsonLd(sample);
    expect(json["@type"]).toBe("Product");
    expect(json.name).toBe(sample.name);
    expect(json.sku).toBe(sample.sku);
    expect(json.offers.priceCurrency).toBe("IRR");
    expect(json.offers.price).toBe(sample.price * 10);
    expect(json.offers.availability).toBe("https://schema.org/InStock");
    expect(json.offers.url).toBe(`${SITE_ORIGIN}/product/vans-dior`);
  });

  it("omits image when the product has none and marks empty stock out", () => {
    const json = productJsonLd({ ...sample, images: [], stock: 0 });
    expect("image" in json).toBe(false);
    expect(json.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("breadcrumbItems", () => {
  it("emits absolute canonical item URLs in position order", () => {
    const json = breadcrumbItems([
      { name: "خانه", path: "/" },
      { name: "کتونی", path: "/category/men-shoes-and-boots" },
    ]);
    expect(json["@type"]).toBe("BreadcrumbList");
    expect(json.itemListElement.map((item) => item.item)).toEqual([
      `${SITE_ORIGIN}/`,
      `${SITE_ORIGIN}/category/men-shoes-and-boots`,
    ]);
    expect(json.itemListElement.map((item) => item.position)).toEqual([1, 2]);
  });
});
