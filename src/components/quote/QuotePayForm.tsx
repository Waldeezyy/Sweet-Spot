"use client";

import { useState } from "react";
import { formatCents } from "@/lib/utils";

type Props = {
  token: string;
  customerName: string;
  quotedPriceCents: number;
  depositPercent: number;
  quoteMessage: string | null;
  stripeEnabled: boolean;
};

export function QuotePayForm({
  token,
  customerName,
  quotedPriceCents,
  depositPercent,
  quoteMessage,
  stripeEnabled,
}: Props) {
  const [paymentChoice, setPaymentChoice] = useState<"deposit" | "full">("deposit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const depositCents = Math.round(quotedPriceCents * (depositPercent / 100));
  const chargeCents = paymentChoice === "full" ? quotedPriceCents : depositCents;
  const balanceDue = paymentChoice === "full" ? 0 : quotedPriceCents - depositCents;

  async function handlePay() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/quotes/${token}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentChoice }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error ?? "Payment could not be started. Brandy can accept Venmo, Cash App, or cash.");
    }
  }

  return (
    <div className="card mt-6">
      <p>Hi {customerName},</p>
      <p className="mt-4">
        Your quoted price: <strong>{formatCents(quotedPriceCents)}</strong>
      </p>
      {quoteMessage && <p className="mt-4 text-sm italic text-[var(--warm-gray)]">{quoteMessage}</p>}

      <div className="mt-6 space-y-3">
        <p className="font-medium">How would you like to pay?</p>
        <label
          className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 ${
            paymentChoice === "deposit" ? "border-[var(--chocolate)] bg-[var(--blush)]/20" : "border-[var(--blush)]"
          }`}
        >
          <input
            type="radio"
            name="paymentChoice"
            checked={paymentChoice === "deposit"}
            onChange={() => setPaymentChoice("deposit")}
            className="mt-1"
          />
          <div>
            <p className="font-semibold">Pay deposit ({depositPercent}%)</p>
            <p className="text-sm text-[var(--warm-gray)]">
              {formatCents(depositCents)} now · {formatCents(balanceDue)} due at pickup
            </p>
          </div>
        </label>
        <label
          className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 ${
            paymentChoice === "full" ? "border-[var(--chocolate)] bg-[var(--blush)]/20" : "border-[var(--blush)]"
          }`}
        >
          <input
            type="radio"
            name="paymentChoice"
            checked={paymentChoice === "full"}
            onChange={() => setPaymentChoice("full")}
            className="mt-1"
          />
          <div>
            <p className="font-semibold">Pay in full now</p>
            <p className="text-sm text-[var(--warm-gray)]">
              {formatCents(quotedPriceCents)} today — nothing more to pay at pickup
            </p>
          </div>
        </label>
      </div>

      {stripeEnabled ? (
        <button type="button" onClick={handlePay} disabled={loading} className="btn-primary mt-6 w-full">
          {loading
            ? "Redirecting..."
            : paymentChoice === "full"
              ? `Approve & Pay ${formatCents(chargeCents)} in Full`
              : `Approve & Pay ${formatCents(chargeCents)} Deposit`}
        </button>
      ) : (
        <p className="mt-6 rounded-xl bg-[var(--blush)]/40 p-4 text-sm text-[var(--warm-gray)]">
          Online payment is not configured yet. Brandy will contact you about paying via Venmo, Cash App, or cash.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-4 text-center text-sm text-[var(--warm-gray)]">
        Prefer Venmo, Cash App, or cash? Reply to Brandy — she can mark your quote paid after you send payment.
      </p>
    </div>
  );
}
