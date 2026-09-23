"use client";

import { Copy, HardDrive, ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteMedia, uploadMedia, type MediaAssetDto } from "@/lib/media-client";
import { toFa } from "@/lib/format";

function bytes(value: number) {
  if (value < 1024) return `${toFa(value)} B`;
  if (value < 1024 * 1024) return `${toFa((value / 1024).toFixed(1))} KB`;
  return `${toFa((value / 1024 / 1024).toFixed(1))} MB`;
}

export function AdminMediaPage({ initialAssets }: { initialAssets: MediaAssetDto[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function addFiles(files: FileList | File[]) {
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded: MediaAssetDto[] = [];
      for (const file of Array.from(files).slice(0, 12)) uploaded.push(await uploadMedia(file));
      setAssets((current) => [...uploaded, ...current]);
      toast.success(`${toFa(uploaded.length)} تصویر در کتابخانه ذخیره شد`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "آپلود تصویر انجام نشد"); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void addFiles(event.target.files);
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  async function remove(asset: MediaAssetDto) {
    if (!window.confirm(`تصویر «${asset.altText || "بدون نام"}» حذف شود؟`)) return;
    try {
      await deleteMedia(asset.id);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      toast.success("رسانه حذف شد");
    } catch (error) { toast.error(error instanceof Error ? error.message : "حذف رسانه انجام نشد"); }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold text-brand">دارایی‌های تصویری</p><h1 className="mt-1 text-2xl font-black">کتابخانه رسانه</h1><p className="mt-1.5 text-[10px] text-muted">تصاویر ماندگار محصولات و بنرها را آپلود، مرور و مدیریت کنید.</p></div><Button onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}آپلود تصویر</Button></div>

      <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} className={`grid min-h-36 place-items-center border border-dashed p-6 text-center transition ${dragging ? "border-brand bg-rose-50" : "border-border bg-white"}`}>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={choose} />
        <div>{busy ? <LoaderCircle className="mx-auto size-7 animate-spin text-brand" /> : <UploadCloud className="mx-auto size-7 text-muted" />}<p className="mt-2 text-[10px] font-black">تصاویر را اینجا رها کنید</p><p className="mt-1 text-[8px] text-muted">اعتبارسنجی و تبدیل امن به WebP در سرور · حداکثر ۸ مگابایت</p></div>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><HardDrive className="size-4 text-brand" /><h2 className="text-xs font-black">تصاویر ذخیره‌شده</h2></div><span className="text-[9px] text-muted">{toFa(assets.length)} فایل</span></div>
        {assets.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{assets.map((asset) => <article key={asset.id} className="group overflow-hidden border border-border bg-white"><div className="relative aspect-square overflow-hidden bg-stone-100"><img src={asset.publicUrl} alt={asset.altText} className="size-full object-cover transition duration-300 group-hover:scale-[1.025]" /><span className="absolute left-2 top-2 rounded bg-black/65 px-1.5 py-1 text-[7px] text-white">{asset.storageDriver.toUpperCase()}</span></div><div className="p-3"><strong className="block truncate text-[9px]">{asset.altText || "تصویر فروشگاه"}</strong><p className="mt-1 text-[8px] text-muted">{toFa(asset.width || 0)}×{toFa(asset.height || 0)} · {bytes(asset.sizeBytes)}</p><div className="mt-3 flex gap-1"><Button variant="ghost" size="sm" className="h-8 flex-1" onClick={async () => { await navigator.clipboard.writeText(asset.publicUrl); toast.success("نشانی تصویر کپی شد"); }}><Copy className="size-3" />کپی نشانی</Button><Button variant="ghost" size="icon" className="size-8 text-rose-600" onClick={() => remove(asset)} title="حذف رسانه"><Trash2 className="size-3.5" /></Button></div></div></article>)}</div> : <div className="grid min-h-60 place-items-center text-[10px] text-muted">کتابخانه رسانه خالی است.</div>}
      </section>
    </div>
  );
}

