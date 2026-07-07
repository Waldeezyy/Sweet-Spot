"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type GalleryImage = { id: string; url: string; isFeatured: boolean; sortOrder: number };

export function PhotoManager({ images: initial }: { images: GalleryImage[] }) {
  const router = useRouter();
  const [toast, setToast] = useState("");

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      const upload = await fetch("/api/upload", { method: "POST", body: form });
      if (upload.ok) {
        const { url } = await upload.json();
        await fetch("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      }
    }
    setToast("Photos uploaded!");
    router.refresh();
  }

  async function toggleFeatured(id: string, isFeatured: boolean) {
    await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !isFeatured }),
    });
    router.refresh();
  }

  async function removePhoto(id: string) {
    if (!confirm("Are you sure? This photo will be removed from your gallery.")) return;
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    setToast("Photo removed.");
    router.refresh();
  }

  return (
    <div className="mt-8">
      {toast && <div className="mb-4 rounded-xl bg-[var(--sage)]/20 p-3 text-sm">{toast}</div>}
      <label className="btn-primary cursor-pointer">
        Upload Photos
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </label>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {initial.map((img) => (
          <div key={img.id} className="card p-2">
            <div className="relative aspect-square overflow-hidden rounded-xl">
              <Image src={img.url} alt="Gallery" fill className="object-cover" unoptimized />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <button type="button" onClick={() => toggleFeatured(img.id, img.isFeatured)} className="text-xs text-[var(--rose)]">
                {img.isFeatured ? "★ Featured" : "Mark featured"}
              </button>
              <button type="button" onClick={() => removePhoto(img.id)} className="text-xs text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
