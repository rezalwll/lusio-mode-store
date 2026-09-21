"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShopPage } from "@/views/store/ShopPage";

function ShopRouteView() {
  const search = useSearchParams();
  return (
    <ShopPage
      initialQuery={search.get("q") ?? ""}
      initialCategory={search.get("category") ?? ""}
      initialSort={search.get("sort") ?? "newest"}
    />
  );
}

export default function ShopRoutePage() {
  return (
    <Suspense>
      <ShopRouteView />
    </Suspense>
  );
}
