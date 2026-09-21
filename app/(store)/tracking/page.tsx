"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrackingPage } from "@/views/store/TrackingPage";

function TrackingRouteView() {
  const search = useSearchParams();
  return <TrackingPage initialCode={search.get("code") ?? ""} />;
}

export default function TrackingRoutePage() {
  return (
    <Suspense>
      <TrackingRouteView />
    </Suspense>
  );
}
