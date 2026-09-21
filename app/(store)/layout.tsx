"use client";

import { type CSSProperties, type ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MiniCart } from "@/components/layout/MiniCart";
import { useStore } from "@/store/use-store";

export default function StoreGroupLayout({ children }: { children: ReactNode }) {
  // SEO metadata comes from Next server metadata only; this layout keeps
  // just the Zustand-powered runtime theme.
  const settings = useStore((state) => state.settings);

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
      <Header />
      <main>{children}</main>
      <Footer />
      <MiniCart />
    </div>
  );
}
