import type { Metadata } from "next";
import "@fontsource-variable/vazirmatn";
import "@/styles/index.css";
import { Providers } from "./providers";
import { SITE_ORIGIN, STORE_NAME } from "@/lib/site";

const TITLE = "الون استایل | فروشگاه پوشاک مردانه";
const DESCRIPTION = "فروشگاه آنلاین پوشاک مردانه الون استایل";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: TITLE, template: "%s | الون استایل" },
  description: DESCRIPTION,
  applicationName: STORE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_ORIGIN,
    siteName: STORE_NAME,
    locale: "fa_IR",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
