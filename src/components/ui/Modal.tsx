"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, description, children, className }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", listener);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", listener); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-100 grid place-items-center bg-black/55 p-3 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className={cn("max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl", className)}>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white px-5 py-4 sm:px-6">
          <div><h2 id="modal-title" className="text-sm font-black">{title}</h2>{description && <p className="mt-1 text-[10px] text-muted">{description}</p>}</div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full bg-stone-100 hover:bg-stone-200" aria-label="بستن"><X className="size-4" /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
