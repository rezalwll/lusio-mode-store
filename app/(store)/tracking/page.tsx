import type { Metadata } from "next";
import { TrackingPage } from "@/views/store/TrackingPage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function TrackingRoutePage({ searchParams }: { searchParams: Promise<{ order?: string; token?: string }> }) {
  const search = await searchParams;
  return <TrackingPage initialOrder={search.order ?? ""} initialToken={search.token ?? ""} />;
}
