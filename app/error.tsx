"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("route rendering failed", error); }, [error]);
  return (
    <main className="container-site flex min-h-[70vh] items-center justify-center py-16 text-center">
      <div className="max-w-md"><span className="mx-auto grid size-16 place-items-center rounded-full bg-rose-50 text-rose-700"><AlertTriangle className="size-7" /></span><p className="mt-5 text-[10px] font-bold text-brand">خطای موقت</p><h1 className="mt-2 text-2xl font-black">نمایش این بخش ممکن نشد</h1><p className="mt-3 text-xs leading-7 text-muted">اتصال یا سرویس موقتاً در دسترس نیست. دوباره تلاش کنید؛ اطلاعات شما تغییری نکرده است.</p><Button className="mt-6" onClick={reset}><RotateCcw className="size-4" />تلاش دوباره</Button>{error.digest && <p className="mt-4 text-[8px] text-muted" dir="ltr">Error reference: {error.digest}</p>}</div>
    </main>
  );
}
