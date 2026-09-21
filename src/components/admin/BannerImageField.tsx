"use client";

import { ImageUp, Link as LinkIcon, LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Field";
import { compressImageFile } from "@/lib/image";
import { cn } from "@/lib/utils";

export function BannerImageField({
  label,
  value,
  onChange,
  error,
  mobile = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mobile?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const image = await compressImageFile(file, mobile ? 1400 : 2200);
      onChange(image);
      toast.success(`${label} آپلود و بهینه شد`);
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "آپلود تصویر انجام نشد");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    void upload(event.target.files?.[0]);
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold">{label}</span><span className="text-[8px] text-muted">WebP خودکار · حداکثر ۸MB</span></div>
      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={cn("group relative overflow-hidden border border-dashed bg-stone-100 transition", mobile ? "mx-auto aspect-[4/5] max-h-72" : "aspect-[16/6]", dragging ? "border-brand ring-4 ring-brand/10" : "border-border")}
      >
        {value ? <img src={value} alt={label} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-muted"><ImageUp className="size-8" /></div>}
        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}{busy ? "در حال آماده‌سازی" : "تعویض تصویر"}</Button>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} hidden />
      </div>
      <div className="relative mt-2"><LinkIcon className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" /><Input value={value.startsWith("data:") ? "" : value} onChange={(event) => onChange(event.target.value)} dir="ltr" className="pr-9 text-[9px]" placeholder={value.startsWith("data:") ? "تصویر از دستگاه آپلود شده؛ برای جایگزینی لینک را وارد کنید" : "یا نشانی تصویر را وارد کنید..."} /></div>
      {error && <span className="mt-1.5 block text-[10px] font-medium text-rose-600">{error}</span>}
    </div>
  );
}
