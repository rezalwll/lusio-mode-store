import type { Metadata } from "next";
import { CartPage } from "@/views/store/CartPage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CartRoutePage() {
  return <CartPage />;
}
