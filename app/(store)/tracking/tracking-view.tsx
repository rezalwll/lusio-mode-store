"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrackingPage } from "@/views/store/TrackingPage";

function TrackingRouteView() {
  const search = useSearchParams();
  return <TrackingPage initialCode={search.get("code") ?? ""} />;
}

export function TrackingView() {
  return (
    <Suspense>
      <TrackingRouteView />
    </Suspense>
  );
}
