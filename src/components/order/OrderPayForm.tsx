"use client";

import { useState } from "react";
import { formatCents } from "@/lib/utils";
import type { PaymentPolicy } from "@/lib/payment-policy";

type Props = {
  token: string;
  customerName: string;
  orderNumber: string;
  baseTotalCents: number;
  rushFeeCents: number;
  finalTotalCents: number;
  policy: PaymentPolicy;
  stripeEnabled: boolean;
};

export function OrderPayForm({
  token,
  customerName,
  orderNumber,
  baseTotalCents,
  rushFeeCents,
  finalTotalCents,
  policy,
  stripeEnabled,
}: Props) {
  const [paymentChoice, setPaymentChoice] = useState<"deposit" | "full">(
    policy.payInFullOnly ? "full" : "deposit"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const payInFull = policy.payInFullOnly || paymentChoice === "full";
  const chargeCents = payInFull ? policy.fullCents : policy.depositCents;

  async function handlePay() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/order/pay/${token}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentChoice: policy.payInFullOnly ? "full" : paymentChoice,
      }),
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
        Your rush order <strong>{orderNumber}</strong> has been approved.
      </p>
      <div className="mt-4 space-y-1 text-sm">
        <p>Order subtotal: {formatCents(baseTotalCents)}</p>
        {rushFeeCents > 0 && <p>Rush fee: {formatCents(rushFeeCents)}</p>}
        <p className="font-semibold">Total due: {formatCents(finalTotalCents)}</p>
      </div>

      <div className="mt-6">
        {policy.payInFullOnly ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--warm-gray)]">{policy.reason}</p>
            <p className="font-semibold text-[var(--chocolate)]">
              Pay now: {formatCents(chargeCents)}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-medium">How would you like to pay?</p>
            <p className="text-sm text-[var(--warm-gray)]">{policy.reason}</p>
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
                <p className="font-semibold">Pay deposit</p>
                <p className="text-sm text-[var(--warm-gray)]">
                  {formatCents(policy.depositCents)} now · {formatCents(policy.balanceAfterDeposit)} due at pickup
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
                  {formatCents(finalTotalCents)} today — nothing more to pay at pickup
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {!stripeEnabled && (
          <p className="rounded-xl bg-[var(--blush)]/40 p-4 text-sm text-[var(--warm-gray)]">
            Online payment is not configured yet. Brandy will contact you about paying via Venmo, Cash App, or cash.
          </p>
        )}
        <button type="button" onClick={handlePay} disabled={loading} className="btn-primary w-full">
          {loading
            ? "Redirecting..."
            : payInFull
              ? `Pay ${formatCents(chargeCents)} in Full`
              : `Pay ${formatCents(chargeCents)} Deposit`}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-4 text-center text-sm text-[var(--warm-gray)]">
        Prefer Venmo, Cash App, or cash? Reply to Brandy — she can mark your order paid after you send payment.
      </p>
    </div>
  );
}
