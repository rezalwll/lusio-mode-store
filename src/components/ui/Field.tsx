import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-[11px] font-bold">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-[10px] font-medium text-rose-600">{error}</span> : hint ? <span className="mt-1.5 block text-[9px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-11 w-full rounded-xl border border-border bg-white px-3 text-xs outline-none transition placeholder:text-black/30 focus:border-ink focus:ring-2 focus:ring-black/5", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full rounded-xl border border-border bg-white px-3 py-3 text-xs leading-6 outline-none transition placeholder:text-black/30 focus:border-ink focus:ring-2 focus:ring-black/5", className)} {...props} />;
}
