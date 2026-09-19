import { ImagePlus, Link as LinkIcon, LoaderCircle, Star, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Field";
import { productPlaceholderUrl } from "@/lib/assets";

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("فقط فایل تصویری مجاز است");
  if (file.size > MAX_FILE_SIZE) throw new Error("حجم هر تصویر باید کمتر از ۸ مگابایت باشد");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.82);
}

export function ProductImageManager({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function addFiles(files: FileList | File[]) {
    const available = MAX_IMAGES - images.length;
    if (available <= 0) return toast.error("حداکثر ۸ تصویر برای هر محصول مجاز است");
    setBusy(true);
    try {
      const selected = Array.from(files).slice(0, available);
      const compressed = await Promise.all(selected.map(compressImage));
      onChange([...images, ...compressed]);
      toast.success(`${compressed.length} تصویر آپلود و بهینه شد`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "آپلود تصویر انجام نشد");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) void addFiles(event.target.files);
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
  }

  function addUrl() {
    const next = url.trim();
    if (!/^https?:\/\//i.test(next)) return toast.error("نشانی تصویر باید با http یا https شروع شود");
    if (images.length >= MAX_IMAGES) return toast.error("حداکثر ۸ تصویر برای هر محصول مجاز است");
    onChange([...images, next]);
    setUrl("");
  }

  function makeCover(index: number) {
    if (index === 0) return;
    onChange([images[index], ...images.filter((_, itemIndex) => itemIndex !== index)]);
  }

  return (
    <div>
      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={`grid min-h-32 place-items-center border border-dashed p-5 text-center transition ${dragging ? "border-brand bg-rose-50" : "border-border bg-stone-50"}`}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFiles} />
        <div>
          {busy ? <LoaderCircle className="mx-auto size-7 animate-spin text-brand" /> : <UploadCloud className="mx-auto size-7 text-muted" />}
          <p className="mt-2 text-[10px] font-black">فایل‌ها را اینجا رها کنید یا از دستگاه انتخاب کنید</p>
          <p className="mt-1 text-[8px] leading-5 text-muted">JPG، PNG یا WebP · بهینه‌سازی خودکار · حداکثر ۸ مگابایت</p>
          <Button type="button" size="sm" variant="outline" className="mt-3" disabled={busy || images.length >= MAX_IMAGES} onClick={() => inputRef.current?.click()}><ImagePlus className="size-3.5" />انتخاب تصویر</Button>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Input value={url} onChange={(event) => setUrl(event.target.value)} dir="ltr" placeholder="https://..." />
        <Button type="button" variant="outline" onClick={addUrl} disabled={!url.trim()}><LinkIcon className="size-4" />افزودن لینک</Button>
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image, index) => (
            <div key={`${image.slice(0, 36)}-${index}`} className="group relative aspect-[3/4] overflow-hidden border border-border bg-stone-100">
              <img src={image || productPlaceholderUrl} alt={`تصویر ${index + 1}`} className="size-full object-cover" onError={(event) => { event.currentTarget.src = productPlaceholderUrl; }} />
              {index === 0 && <span className="absolute right-1.5 top-1.5 flex items-center gap-1 bg-ink px-2 py-1 text-[7px] font-bold text-white"><Star className="size-2.5 fill-current" />کاور</span>}
              <div className="absolute inset-x-1.5 bottom-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                {index > 0 && <button type="button" onClick={() => makeCover(index)} className="flex h-7 flex-1 items-center justify-center bg-white text-[7px] font-bold shadow">انتخاب کاور</button>}
                <button type="button" onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))} className="grid size-7 place-items-center bg-rose-600 text-white shadow" aria-label="حذف تصویر"><Trash2 className="size-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
