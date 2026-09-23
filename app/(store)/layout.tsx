import type { Metadata } from "next";
import { type CSSProperties, type ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MiniCart } from "@/components/layout/MiniCart";
import { getProducts } from "@/server/catalog";
import { getStoreSettings } from "@/server/store-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const title = settings.seoTitle || `${settings.storeName} | فروشگاه پوشاک مردانه`;
  const description = settings.seoDescription || settings.footerDescription || "فروشگاه آنلاین پوشاک مردانه";
  return {
    title: { default: title, template: `%s | ${settings.storeName}` },
    description,
    applicationName: settings.storeName,
    openGraph: { siteName: settings.storeName, locale: "fa_IR", title, description },
    twitter: { card: "summary", title, description },
  };
}

export default async function StoreGroupLayout({ children }: { children: ReactNode }) {
  const [settings, products] = await Promise.all([getStoreSettings(), getProducts()]);

  const theme = {
    "--color-brand": settings.themeBrand || "#8f4d59",
    "--color-brand-dark": settings.themeBrandDark || "#6c3640",
    "--color-ink": settings.themeInk || "#2c2825",
    "--color-border": settings.themeBorder || "#e8d9cf",
    "--color-canvas": settings.themeSurface || "#fbf7f3",
    "--color-mint": settings.themeMint || "#b6dfd8",
    "--color-blush": settings.themeBlush || "#e8c7d7",
    backgroundColor: settings.themeBackground || "#fffdfb",
  } as CSSProperties;
  return (
    <div className="min-h-screen" style={theme}>
      <Header products={products} settings={settings} />
      <main>{children}</main>
      <Footer settings={settings} />
      <MiniCart products={products} />
    </div>
  );
}
