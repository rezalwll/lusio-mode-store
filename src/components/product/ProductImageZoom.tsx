"use client";

import { ZoomIn } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { productPlaceholderUrl } from "@/lib/assets";

export function ProductImageZoom({ src, alt }: { src: string; alt: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoomed, setZoomed] = useState(false);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !imageRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    imageRef.current.style.transformOrigin = `${x}% ${y}%`;
  }

  function enter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") setZoomed(true);
  }

  function leave() {
    setZoomed(false);
    if (imageRef.current) imageRef.current.style.transformOrigin = "50% 50%";
  }

  return (
    <div
      className="group relative size-full overflow-hidden bg-[#f1e8e2] lg:cursor-zoom-in"
      onPointerEnter={enter}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <img
        ref={imageRef}
        src={src || productPlaceholderUrl}
        alt={alt}
        className={`size-full object-cover transition-transform duration-200 ease-out ${zoomed ? "scale-[2.25]" : "scale-100"}`}
        onError={(event) => { event.currentTarget.src = productPlaceholderUrl; }}
        draggable={false}
      />
      <span className={`absolute bottom-4 right-4 hidden items-center gap-2 bg-[#fffdfb]/92 px-3 py-2 text-[9px] font-bold text-ink shadow-sm backdrop-blur transition lg:flex ${zoomed ? "opacity-0" : "opacity-100"}`}>
        <ZoomIn className="size-3.5" /> برای بزرگ‌نمایی موس را حرکت دهید
      </span>
    </div>
  );
}
