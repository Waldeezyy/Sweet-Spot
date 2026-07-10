"use client";

import { useState } from "react";
import Link from "next/link";
import { ORDERING_PATHS } from "@/lib/ordering-paths";
import { PreferredContactMethodField } from "@/components/order/PreferredContactMethodField";

export default function CustomOrderPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [photos, setPhotos] = useState<string[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("");

  async function handlePhotoFiles(files: FileList | null) {
    if (!files) return;
    const uploads: string[] = [];
    for (const file of Array.from(files).slice(0, 3)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        uploads.push(url);
      }
    }
    setPhotos((prev) => [...prev, ...uploads].slice(0, 3));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        customerEmail: form.get("customerEmail"),
        customerPhone: form.get("customerPhone"),
        preferredContactMethod: preferredContactMethod || undefined,
        occasion: form.get("occasion"),
        scheduledDate: form.get("scheduledDate"),
        servings: Number(form.get("servings")) || null,
        description: form.get("description"),
        dietaryNotes: form.get("dietaryNotes"),
        budgetRange: form.get("budgetRange"),
        inspirationPhotos: photos,
      }),
    });
    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Request Received!</h1>
        <p className="mt-4 text-[var(--warm-gray)]">Brandy will review your request and send you a quote within 24 hours. You can pay online or arrange Venmo, Cash App, or cash after she contacts you.</p>
        <Link href="/" className="btn-primary mt-8 inline-flex">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">Custom Order Request</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Tell us about your vision — we&apos;ll send you a personalized quote.</p>
      <p className="mt-2 text-sm text-[var(--warm-gray)]">
        {ORDERING_PATHS.crossLinks.menuFromCustom}{" "}
        <Link href="/menu" className="text-[var(--rose)] hover:underline">
          {ORDERING_PATHS.crossLinks.menuFromCustomLink}
        </Link>
        .
      </p>
      <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
        <div>
          <label className="label">What&apos;s the occasion?</label>
          <select name="occasion" required className="input">
            <option value="">Select...</option>
            {["Birthday", "Wedding", "Baby shower", "Corporate", "Other"].map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date needed</label>
          <input name="scheduledDate" type="date" required className="input" />
        </div>
        <div>
          <label className="label">Servings / guest count</label>
          <input name="servings" type="number" min={1} className="input" />
        </div>
        <div>
          <label className="label">Describe your vision *</label>
          <textarea name="description" required className="input min-h-[120px]" placeholder="Colors, theme, style..." />
        </div>
        <div>
          <label className="label">Inspiration photos (up to 3)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => handlePhotoFiles(e.target.files)} className="input" />
          {photos.length > 0 && <p className="text-sm text-[var(--sage)]">{photos.length} photo(s) uploaded</p>}
        </div>
        <div>
          <label className="label">Dietary / allergy needs</label>
          <input name="dietaryNotes" className="input" />
        </div>
        <div>
          <label className="label">Budget range (optional)</label>
          <select name="budgetRange" className="input">
            <option value="">Prefer not to say</option>
            <option>Under $75</option>
            <option>$75–150</option>
            <option>$150–300</option>
            <option>$300+</option>
          </select>
        </div>
        <div>
          <label className="label">Your name *</label>
          <input name="customerName" required className="input" />
        </div>
        <div>
          <label className="label">Email *</label>
          <input name="customerEmail" type="email" required className="input" />
        </div>
        <div>
          <label className="label">Phone (optional)</label>
          <input
            name="customerPhone"
            className="input"
            value={customerPhone}
            onChange={(e) => {
              const value = e.target.value;
              setCustomerPhone(value);
              if (!value.trim()) setPreferredContactMethod("");
            }}
          />
        </div>
        <PreferredContactMethodField
          phone={customerPhone}
          value={preferredContactMethod}
          onChange={setPreferredContactMethod}
        />
        <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
          {status === "loading" ? "Submitting..." : "Submit Request"}
        </button>
        {status === "error" && <p className="text-sm text-red-600">Something went wrong. Please try again or email us directly.</p>}
      </form>
    </div>
  );
}
