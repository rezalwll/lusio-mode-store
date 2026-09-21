import type { Metadata } from "next";
import "@/styles/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "الون استایل | فروشگاه پوشاک مردانه",
  description: "فروشگاه آنلاین پوشاک مردانه الون استایل",
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
