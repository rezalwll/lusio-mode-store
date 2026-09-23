"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useStore } from "@/store/use-store";

// Rehydrates persisted browser state once, after mount: the first server and
// client renders both use default store state (skipHydration), then this
// effect restores only the returning user's cart identifiers and coupon code
// through normal Zustand subscribers.
function StoreHydrator() {
  useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <StoreHydrator />
      {children}
      <Toaster position="bottom-center" dir="rtl" richColors closeButton />
    </QueryClientProvider>
  );
}
