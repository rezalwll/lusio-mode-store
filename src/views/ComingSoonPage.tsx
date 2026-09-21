import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-stone-100"><Construction className="size-7" /></span>
      <h1 className="mt-5 text-2xl font-black">{title}</h1>
      <p className="mt-2 text-xs text-muted">این بخش در مرحله بعدی بازسازی فعال می‌شود.</p>
      <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-bold text-white"><ArrowRight className="size-4" />بازگشت به خانه</Link>
    </div>
  );
}
