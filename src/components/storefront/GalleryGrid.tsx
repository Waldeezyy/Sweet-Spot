"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [selected, setSelected] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelected(img)}
            className="relative aspect-square overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--sage)] focus:ring-offset-2"
            aria-label={`View full size: ${img.alt ?? "Bakery creation"}`}
          >
            <Image src={img.url} alt={img.alt ?? "Bakery creation"} fill className="object-cover" unoptimized />
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Full size gallery image"
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-2xl text-white hover:bg-white/20"
            aria-label="Close"
          >
            ×
          </button>
          <div
            className="relative max-h-[90vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.url}
              alt={selected.alt ?? "Bakery creation"}
              className="mx-auto max-h-[90vh] w-auto max-w-full rounded-lg object-contain"
            />
            {selected.alt && (
              <p className="mt-3 text-center text-sm text-white/80">{selected.alt}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
