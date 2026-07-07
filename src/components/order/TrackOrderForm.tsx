"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function TrackOrderForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/order/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "We couldn't find that order. Check your order number and email.");
      return;
    }
    router.push(`/order/status/${data.trackingToken}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto mt-8 max-w-md space-y-4">
      <div>
        <label className="label">Order number</label>
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="input"
          placeholder="e.g. BSS-20260706-ABC1"
          required
        />
      </div>
      <div>
        <label className="label">Email used at checkout</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Looking up..." : "Track order"}
      </button>
      <p className="text-center text-sm text-[var(--warm-gray)]">
        <Link href="/menu" className="text-[var(--rose)] hover:underline">Place a new order</Link>
      </p>
    </form>
  );
}
