"use client";

import { Images, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { fetchMedia, type MediaAssetDto } from "@/lib/media-client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

export function MediaLibraryPicker({ onSelect, disabled }: { onSelect: (url: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<MediaAssetDto[]>([]);

  async function show() {
    setOpen(true);
    setLoading(true);
    try { setAssets(await fetchMedia()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "دریافت رسانه‌ها انجام نشد"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={show} disabled={disabled}><Images className="size-4" />کتابخانه رسانه</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="انتخاب از کتابخانه رسانه" description="تصاویر آپلودشده و ماندگار فروشگاه" className="max-w-5xl">
        <div className="min-h-72 p-5 sm:p-6">
          {loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="size-7 animate-spin text-brand" /></div> : assets.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {assets.map((asset) => <button key={asset.id} type="button" onClick={() => { onSelect(asset.publicUrl); setOpen(false); }} className="group text-right"><span className="block aspect-square overflow-hidden border border-border bg-stone-100"><img src={asset.publicUrl} alt={asset.altText} className="size-full object-cover transition group-hover:scale-[1.03]" /></span><span className="mt-1.5 block truncate text-[9px] font-bold">{asset.altText || "تصویر فروشگاه"}</span><span className="text-[8px] text-muted">{asset.width}×{asset.height}</span></button>)}
            </div>
          ) : <div className="grid min-h-64 place-items-center text-[10px] text-muted">هنوز تصویری آپلود نشده است.</div>}
        </div>
      </Modal>
    </>
  );
}

