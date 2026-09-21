import type { Metadata } from "next";
import { CheckoutPage } from "@/views/store/CheckoutPage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CheckoutRoutePage() {
  return <CheckoutPage />;
}
