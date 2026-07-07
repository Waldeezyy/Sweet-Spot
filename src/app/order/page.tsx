"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/storefront/CartProvider";
import { formatCents } from "@/lib/utils";
import { hasSemiCustom } from "@/lib/cart";
import { getPaymentPolicy, resolveCheckoutPayment, type PaymentChoice } from "@/lib/payment-policy";
import { formatCartItemDetails } from "@/lib/order-item-display";
import { OrderSteps } from "@/components/order/OrderSteps";

type Settings = {
  orderMinimumCents: number;
  depositPercent: number;
  fullPaymentThresholdCents: number;
  leadTimeDays: number;
  deliveryRadiusMiles: number;
  deliveryFeeCents: number;
  pickupInstructions: string;
  deliveryNote: string;
};

type BlockedDate = { date: string; isBlocked: boolean };

export default function OrderPage() {
  const { items, subtotalCents, meta, setMeta, removeItem } = useCart();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("deposit");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
    fetch("/api/availability").then((r) => r.json()).then(setBlockedDates);
  }, []);

  const deliveryFee = meta.fulfillmentType === "DELIVERY" ? (settings?.deliveryFeeCents ?? 0) : 0;
  const totalCents = subtotalCents + deliveryFee;
  const minimum = settings?.orderMinimumCents ?? 2500;
  const belowMinimum = subtotalCents < minimum;

  const policy = settings
    ? getPaymentPolicy(items, totalCents, {
        depositPercent: settings.depositPercent,
        fullPaymentThresholdCents: settings.fullPaymentThresholdCents,
      })
    : null;

  const payment = policy
    ? resolveCheckoutPayment(policy.payInFullOnly ? "full" : paymentChoice, policy)
    : null;

  const semiCustom = hasSemiCustom(items);

  function validateStep(): boolean {
    const e: Record<string, string> = {};
    if (step === 1 && items.length === 0) e.items = "Add at least one item to your order.";
    if (step === 1 && belowMinimum) e.items = `Add ${formatCents(minimum - subtotalCents)} more to reach the ${formatCents(minimum)} minimum.`;
    if (step === 3) {
      if (!meta.fulfillmentType) e.fulfillment = "Please choose pickup or delivery.";
      if (meta.fulfillmentType === "DELIVERY" && !meta.deliveryAddress?.trim()) e.address = "Please enter your delivery address.";
    }
    if (step === 4) {
      if (!meta.scheduledDate) e.date = "Please pick a date.";
      else if (settings) {
        const min = new Date();
        min.setDate(min.getDate() + settings.leadTimeDays);
        min.setHours(0, 0, 0, 0);
        if (new Date(meta.scheduledDate) < min) e.date = `Please pick a date at least ${settings.leadTimeDays} days from today.`;
        const blocked = blockedDates.find((d) => d.date === meta.scheduledDate && d.isBlocked);
        if (blocked) e.date = "This date is not available. Please choose another.";
      }
    }
    if (step === 5) {
      if (!meta.customerName?.trim()) e.name = "Please enter your name.";
      if (!meta.customerEmail?.trim()) e.email = "Please enter your email.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCheckout() {
    if (!validateStep()) return;
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        meta,
        totalCents,
        deliveryFeeCents: deliveryFee,
        paymentChoice: policy?.payInFullOnly ? "full" : paymentChoice,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
    else setErrors({ checkout: data.error ?? "Checkout failed. Please try again." });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">Place Your Order</h1>
      <OrderSteps current={step} />

      {step === 1 && (
        <section className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="card text-center">
              <p className="text-[var(--warm-gray)]">Your cart is empty.</p>
              <Link href="/menu" className="btn-primary mt-4 inline-flex">Browse Menu</Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="card flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{item.productName} × {item.quantity}</h3>
                  {formatCartItemDetails(item).map((line) => (
                    <p key={line} className="text-sm text-[var(--warm-gray)]">{line}</p>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatCents(item.unitPriceCents * item.quantity)}</span>
                  <button type="button" onClick={() => removeItem(item.id)} className="text-sm text-red-600">Remove</button>
                </div>
              </div>
            ))
          )}
          {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}
          <Link href="/menu" className="text-sm text-[var(--rose)] hover:underline">+ Add more items</Link>
        </section>
      )}

      {step === 2 && (
        <section className="card mt-8">
          <p className="text-[var(--warm-gray)]">Review your customizations above. To change an item, go back to step 1 and remove it, then add again from the menu.</p>
          {hasSemiCustom(items) && (
            <p className="mt-4 rounded-xl bg-[var(--blush)]/40 p-4 text-sm">
              Your order includes custom items. Deposit secures your date — Brandy will confirm your final price within 24 hours.
            </p>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="card mt-8 space-y-4">
          <div className="flex gap-4">
            {(["PICKUP", "DELIVERY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMeta({ ...meta, fulfillmentType: type })}
                className={`flex-1 rounded-xl border-2 p-4 font-semibold ${meta.fulfillmentType === type ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"}`}
              >
                {type === "PICKUP" ? "Pickup" : "Delivery"}
              </button>
            ))}
          </div>
          {meta.fulfillmentType === "PICKUP" && settings && (
            <p className="text-sm text-[var(--warm-gray)]">{settings.pickupInstructions}</p>
          )}
          {meta.fulfillmentType === "DELIVERY" && (
            <>
              <p className="text-sm text-[var(--warm-gray)]">{settings?.deliveryNote}</p>
              <div>
                <label className="label">Delivery address</label>
                <textarea
                  className="input min-h-[80px]"
                  value={meta.deliveryAddress ?? ""}
                  onChange={(e) => setMeta({ ...meta, deliveryAddress: e.target.value })}
                />
              </div>
            </>
          )}
          {errors.fulfillment && <p className="text-sm text-red-600">{errors.fulfillment}</p>}
          {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
        </section>
      )}

      {step === 4 && (
        <section className="card mt-8">
          <label className="label">Pickup / delivery date</label>
          <input
            type="date"
            className="input max-w-xs"
            value={meta.scheduledDate ?? ""}
            onChange={(e) => setMeta({ ...meta, scheduledDate: e.target.value })}
          />
          {errors.date && <p className="mt-2 text-sm text-red-600">{errors.date}</p>}
        </section>
      )}

      {step === 5 && (
        <section className="card mt-8 space-y-4">
          <div>
            <label className="label">Your name</label>
            <input className="input" value={meta.customerName ?? ""} onChange={(e) => setMeta({ ...meta, customerName: e.target.value })} />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={meta.customerEmail ?? ""} onChange={(e) => setMeta({ ...meta, customerEmail: e.target.value })} />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" value={meta.customerPhone ?? ""} onChange={(e) => setMeta({ ...meta, customerPhone: e.target.value })} />
          </div>
          <div className="rounded-xl bg-[var(--cream)] p-4 text-sm space-y-1">
            <p>Subtotal: {formatCents(subtotalCents)}</p>
            {deliveryFee > 0 && <p>Delivery: {formatCents(deliveryFee)}</p>}
            <p className="font-semibold">Order total: {formatCents(totalCents)}</p>

            {policy && (
              <>
                <p className="mt-3 text-[var(--warm-gray)]">{policy.reason}</p>

                {policy.payInFullOnly ? (
                  <p className="mt-2 font-semibold text-[var(--chocolate)]">
                    Pay now: {formatCents(payment?.chargeCents ?? totalCents)}
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="font-medium">How would you like to pay?</p>
                    <label className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 ${paymentChoice === "deposit" ? "border-[var(--chocolate)] bg-white" : "border-[var(--blush)]"}`}>
                      <input
                        type="radio"
                        name="paymentChoice"
                        checked={paymentChoice === "deposit"}
                        onChange={() => setPaymentChoice("deposit")}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold">Pay deposit ({settings?.depositPercent}%)</p>
                        <p className="text-[var(--warm-gray)]">
                          {formatCents(policy.depositCents)} now · {formatCents(policy.balanceAfterDeposit)} due at pickup/delivery
                        </p>
                      </div>
                    </label>
                    <label className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 ${paymentChoice === "full" ? "border-[var(--chocolate)] bg-white" : "border-[var(--blush)]"}`}>
                      <input
                        type="radio"
                        name="paymentChoice"
                        checked={paymentChoice === "full"}
                        onChange={() => setPaymentChoice("full")}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold">Pay in full now</p>
                        <p className="text-[var(--warm-gray)]">
                          {formatCents(policy.fullCents)} today — nothing more to pay at pickup
                          {semiCustom && " (based on current estimate; Brandy will confirm final price)"}
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </>
            )}
          </div>
          {errors.checkout && <p className="text-sm text-red-600">{errors.checkout}</p>}
        </section>
      )}

      <div className="mt-8 flex justify-between">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary">Back</button>
        ) : (
          <span />
        )}
        {step < 5 ? (
          <button
            type="button"
            onClick={() => validateStep() && setStep((s) => s + 1)}
            className="btn-primary"
            disabled={step === 1 && (items.length === 0 || belowMinimum)}
          >
            Next
          </button>
        ) : (
          <button type="button" onClick={handleCheckout} disabled={loading || !payment} className="btn-primary">
            {loading
              ? "Processing..."
              : payment?.paidInFull
                ? `Pay ${formatCents(payment.chargeCents)} in Full`
                : `Pay ${formatCents(payment?.chargeCents ?? 0)} Deposit`}
          </button>
        )}
      </div>
    </div>
  );
}
