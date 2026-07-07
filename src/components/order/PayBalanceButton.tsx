"use client";

import { useState } from "react";
import { formatCents } from "@/lib/utils";

type Props = {
  token: string;
  balanceDueCents: number;
  onlinePaymentEnabled: boolean;
};

export function PayBalanceButton({ token, balanceDueCents, onlinePaymentEnabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/order/balance/${token}/checkout`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error ?? "Online payment could not be started.");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--sage)]/30 bg-[var(--sage)]/10 p-4">
      <p className="font-semibold">Remaining balance: {formatCents(balanceDueCents)}</p>
      {onlinePaymentEnabled ? (
        <>
          <p className="mt-1 text-sm text-[var(--warm-gray)]">
            Pay online now, or bring cash, Venmo, or Cash App at pickup/delivery.
          </p>
          <button type="button" onClick={handlePay} disabled={loading} className="btn-primary mt-3 w-full">
            {loading ? "Redirecting…" : `Pay ${formatCents(balanceDueCents)} online`}
          </button>
        </>
      ) : (
        <p className="mt-1 text-sm text-[var(--warm-gray)]">
          Pay with cash, Venmo, or Cash App at pickup/delivery.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
