// Single canonical site origin for metadata, canonical URLs, robots and
// sitemap. Evidence: settings content imagery, admin artwork and all 385
// catalog product images reference https://elevenstyle.ir, which remains the
// public storefront origin.
export const SITE_ORIGIN = "https://elevenstyle.ir";

export const STORE_NAME = "الون استایل";

export function canonical(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}
