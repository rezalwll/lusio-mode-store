import { z } from "zod";

const optionalText = z.string().max(2000).optional();
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();

export const navigationItemInputSchema = z.object({
  id: z.string().max(100), label: z.string().trim().min(1).max(80), mode: z.enum(["category", "search"]),
  target: z.string().trim().min(1).max(160), fallbackSlug: z.string().trim().max(160), active: z.boolean(),
});

export const storeSettingsInputSchema = z.object({
  storeName: z.string().trim().min(2).max(120), announcement: z.string().trim().max(240),
  supportPhone: z.string().trim().min(8).max(20), address: z.string().trim().max(500),
  shippingCost: z.number().int().nonnegative().max(100_000_000), freeShippingThreshold: z.number().int().nonnegative().max(10_000_000_000),
  instagram: z.string().trim().max(100), heroTitle: z.string().trim().min(2).max(160), heroSubtitle: z.string().trim().max(500),
  heroImage: z.string().trim().min(1).max(2000), heroMobileImage: z.string().trim().min(1).max(2000),
  heroEyebrow: optionalText, heroPrimaryCta: optionalText, storyTitle: optionalText, editorialTitle: optionalText, editorialText: optionalText,
  showNewArrivals: z.boolean().optional(), showCategories: z.boolean().optional(), showEditorial: z.boolean().optional(),
  showBestSellers: z.boolean().optional(), showSaleProducts: z.boolean().optional(), showFestival: z.boolean().optional(),
  festivalEyebrow: optionalText, festivalTitle: optionalText, festivalSubtitle: optionalText, festivalImage: optionalText,
  monthlySalesTarget: z.number().int().nonnegative().optional(), announcementEnabled: z.boolean().optional(),
  seoTitle: optionalText, seoDescription: optionalText, footerDescription: optionalText, footerCopyright: optionalText, footerTagline: optionalText,
  newArrivalsEyebrow: optionalText, newArrivalsTitle: optionalText, categoriesEyebrow: optionalText, categoriesTitle: optionalText,
  categoriesDescription: optionalText, saleEyebrow: optionalText, saleTitle: optionalText, editorialEyebrow: optionalText,
  editorialCta: optionalText, bestSellersEyebrow: optionalText, bestSellersTitle: optionalText, festivalCta: optionalText,
  relatedEyebrow: optionalText, relatedTitle: optionalText, trustShippingTitle: optionalText, trustShippingText: optionalText,
  trustReturnTitle: optionalText, trustReturnText: optionalText, trustQualityTitle: optionalText, trustQualityText: optionalText,
  trustSupportTitle: optionalText, trustSupportText: optionalText,
  themeBrand: color, themeBrandDark: color, themeInk: color, themeBackground: color, themeSurface: color,
  themeBorder: color, themeMint: color, themeBlush: color,
  lowStockThreshold: z.number().int().nonnegative().max(100_000).optional(),
  navigationItems: z.array(navigationItemInputSchema).max(30).optional(),
  homeSectionOrder: z.array(z.enum(["new", "sale", "categories", "festival", "editorial", "best", "trust"])).max(7).optional(),
});
