"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/utils";
import { format } from "date-fns";
import { formatOrderItemLine } from "@/lib/order-item-display";
import { STATUS_LABELS } from "@/lib/order-tracking";

type OrderItem = {
  productName: string;
  productSlug: string | null;
  quantity: number;
  flavor: string | null;
  frosting: string | null;
  toppings: string | null;
  designNotes: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  trackingToken: string;
  status: string;
  customerName: string;
  customerEmail: string;
  scheduledDate: string;
  totalCents: number;
  finalTotalCents: number | null;
  depositCents: number;
  balanceDueCents: number;
  paidInFull: boolean;
  items: OrderItem[];
};

const statusActions: Record<string, { label: string; next: string }[]> = {
  PENDING_REVIEW: [{ label: "Confirm order", next: "CONFIRMED" }],
  CONFIRMED: [{ label: "Start making", next: "IN_PROGRESS" }],
  IN_PROGRESS: [{ label: "Ready for pickup", next: "READY" }],
  READY: [{ label: "Completed", next: "COMPLETED" }],
};

export function OrdersManager({ orders: initial }: { orders: Order[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Order | null>(null);
  const [finalPrice, setFinalPrice] = useState("");
  const [estimatedReady, setEstimatedReady] = useState("");
  const [toast, setToast] = useState("");

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function updateStatus(
    id: string,
    status: string,
    options?: { finalTotalCents?: number; estimatedReadyAt?: string }
  ) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...options }),
    });
    notify("Status updated — customer will receive a detailed email if Resend is configured.");
    router.refresh();
    setSelected(null);
    setEstimatedReady("");
  }

  function defaultEstimatedReady(scheduledDate: string): string {
    const d = new Date(scheduledDate);
    d.setHours(14, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openOrder(order: Order) {
    setSelected(order);
    setEstimatedReady(defaultEstimatedReady(order.scheduledDate));
  }

  function copyTrackLink(order: Order) {
    const url = `${window.location.origin}/order/status/${order.trackingToken}`;
    navigator.clipboard.writeText(url);
    notify("Track link copied — paste in Facebook DM or text.");
  }

  return (
    <div className="mt-8 space-y-4">
      {toast && <div className="rounded-xl bg-[var(--sage)]/20 p-3 text-sm">{toast}</div>}
      {initial.map((o) => (
        <div
          key={o.id}
          className={`card cursor-pointer ${o.status === "PENDING_REVIEW" ? "border-yellow-400 border-2" : ""}`}
          onClick={() => openOrder(o)}
        >
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold">{o.orderNumber}</p>
              <p className="text-sm text-[var(--warm-gray)]">{o.customerName} · {format(new Date(o.scheduledDate), "MMM d, yyyy")}</p>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-[var(--blush)] px-2 py-1 text-xs">
                {STATUS_LABELS[o.status as keyof typeof STATUS_LABELS] ?? o.status.replace(/_/g, " ")}
              </span>
              <p className="mt-1 font-semibold">{formatCents(o.finalTotalCents ?? o.totalCents)}</p>
            </div>
          </div>
        </div>
      ))}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card max-h-[90vh] max-w-lg overflow-y-auto">
            <h3 className="font-semibold">{selected.orderNumber}</h3>
            <p className="text-sm">{selected.customerName} — {selected.customerEmail}</p>
            <p className="mt-2 text-sm text-[var(--warm-gray)]">
              {selected.paidInFull
                ? `Paid in full: ${formatCents(selected.depositCents)}`
                : `Deposit: ${formatCents(selected.depositCents)} · Balance due: ${formatCents(selected.balanceDueCents)}`}
            </p>
            <button
              type="button"
              onClick={() => copyTrackLink(selected)}
              className="btn-secondary mt-3 text-sm"
            >
              Copy track link for customer
            </button>
            <ul className="mt-4 space-y-2 text-sm">
              {selected.items.map((i, idx) => (
                <li key={idx}>{formatOrderItemLine(i)}</li>
              ))}
            </ul>
            {selected.status === "PENDING_REVIEW" && (
              <div className="mt-4">
                <label className="label">Set final price ($)</label>
                <input type="number" step="0.01" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} className="input" placeholder={(selected.totalCents / 100).toFixed(2)} />
                <button
                  type="button"
                  className="btn-primary mt-2 w-full"
                  onClick={() =>
                    updateStatus(selected.id, "CONFIRMED", {
                      finalTotalCents: Math.round(parseFloat(finalPrice || String(selected.totalCents / 100)) * 100),
                    })
                  }
                >
                  Confirm order
                </button>
              </div>
            )}
            {selected.status === "CONFIRMED" && (
              <div className="mt-4">
                <label className="label">Estimated ready time</label>
                <input
                  type="datetime-local"
                  value={estimatedReady}
                  onChange={(e) => setEstimatedReady(e.target.value)}
                  className="input"
                />
                <p className="mt-1 text-xs text-[var(--warm-gray)]">
                  Customers receive this in their &quot;We&apos;re making your order&quot; email.
                </p>
                <button
                  type="button"
                  className="btn-primary mt-2 w-full"
                  onClick={() =>
                    updateStatus(selected.id, "IN_PROGRESS", {
                      estimatedReadyAt: new Date(estimatedReady).toISOString(),
                    })
                  }
                >
                  Start making
                </button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(statusActions[selected.status] ?? [])
                .filter((a) => a.next !== "IN_PROGRESS")
                .map((a) => (
                <button key={a.next} type="button" onClick={() => updateStatus(selected.id, a.next)} className="btn-secondary text-sm">
                  {a.label}
                </button>
              ))}
              <button type="button" onClick={() => setSelected(null)} className="btn-secondary text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
