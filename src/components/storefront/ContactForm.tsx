"use client";

import { useState } from "react";
import { PreferredContactMethodField } from "@/components/order/PreferredContactMethodField";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [phone, setPhone] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        preferredContactMethod: preferredContactMethod || undefined,
        message: form.get("message"),
      }),
    });
    setStatus(res.ok ? "success" : "error");
    if (res.ok) {
      e.currentTarget.reset();
      setPhone("");
      setPreferredContactMethod("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input id="name" name="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone (optional)</label>
        <input
          id="phone"
          name="phone"
          className="input"
          value={phone}
          onChange={(e) => {
            const value = e.target.value;
            setPhone(value);
            if (!value.trim()) setPreferredContactMethod("");
          }}
        />
      </div>
      <PreferredContactMethodField
        phone={phone}
        value={preferredContactMethod}
        onChange={setPreferredContactMethod}
      />
      <div>
        <label className="label" htmlFor="message">Message</label>
        <textarea id="message" name="message" required className="input min-h-[120px]" />
      </div>
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
      {status === "success" && <p className="text-sm text-[var(--sage)]">Message sent! We&apos;ll get back to you soon.</p>}
      {status === "error" && <p className="text-sm text-red-600">Something went wrong. Please try emailing us directly.</p>}
    </form>
  );
}
