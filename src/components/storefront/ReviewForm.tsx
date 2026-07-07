"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MAX_PHOTOS = 3;

export function ReviewForm() {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || photos.length >= MAX_PHOTOS) return;
    setUploading(true);
    setError("");
    const uploads: string[] = [];
    const remaining = MAX_PHOTOS - photos.length;
    for (const file of Array.from(files).slice(0, remaining)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        uploads.push(url);
      } else {
        setError("One or more photos could not be uploaded. Try smaller images.");
      }
    }
    setPhotos((prev) => [...prev, ...uploads].slice(0, MAX_PHOTOS));
    setUploading(false);
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: form.get("author"),
        rating,
        text: form.get("text"),
        itemName: form.get("itemName") || undefined,
        photos,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      e.currentTarget.reset();
      setRating(5);
      setPhotos([]);
      router.refresh();
    } else {
      setStatus("error");
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-10 space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Leave a review</h2>
      <p className="text-sm text-[var(--warm-gray)]">
        Loved your order from B&apos;s Sweet Spot? We&apos;d love to hear about it!
      </p>

      <div>
        <label className="label">Your name</label>
        <input name="author" required maxLength={80} className="input" placeholder="First name or nickname" />
      </div>

      <div>
        <label className="label">Rating</label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`text-2xl transition-colors ${value <= rating ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label">What did you order? (optional)</label>
        <input name="itemName" maxLength={120} className="input" placeholder="e.g. Birthday cake, party pack" />
      </div>

      <div>
        <label className="label">Photos of your order (optional, up to {MAX_PHOTOS})</label>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={photos.length >= MAX_PHOTOS || uploading}
          onChange={(e) => {
            handlePhotoFiles(e.target.files);
            e.target.value = "";
          }}
          className="input"
        />
        {uploading && <p className="mt-1 text-sm text-[var(--warm-gray)]">Uploading...</p>}
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {photos.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--chocolate)] text-xs text-white"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">Your review</label>
        <textarea
          name="text"
          required
          minLength={10}
          maxLength={2000}
          className="input min-h-[120px]"
          placeholder="Tell others what you loved..."
        />
      </div>

      <button type="submit" disabled={status === "loading" || uploading} className="btn-primary w-full sm:w-auto">
        {status === "loading" ? "Submitting..." : "Submit review"}
      </button>

      {status === "success" && (
        <p className="text-sm text-[var(--sage)]">Thank you! Your review has been posted.</p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
