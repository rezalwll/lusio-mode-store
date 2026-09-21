import type { Metadata } from "next";
import { AccountPage } from "@/views/store/AccountPage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountRoutePage() {
  return <AccountPage />;
}
