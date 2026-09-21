import type { Metadata } from "next";
import { TrackingView } from "./tracking-view";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function TrackingRoutePage() {
  return <TrackingView />;
}
