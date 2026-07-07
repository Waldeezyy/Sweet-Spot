"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm() {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

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
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      e.currentTarget.reset();
      setRating(5);
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

      <button type="submit" disabled={status === "loading"} className="btn-primary w-full sm:w-auto">
        {status === "loading" ? "Submitting..." : "Submit review"}
      </button>

      {status === "success" && (
        <p className="text-sm text-[var(--sage)]">Thank you! Your review has been posted.</p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
