"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/utils";
import { format } from "date-fns";
import { formatPartyItemSummary, isPartyProductSlug } from "@/lib/party-packages";

type OrderItem = {
  productName: string;
  productSlug: string | null;
  quantity: number;
  flavor: string | null;
  frosting: string | null;
  designNotes: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
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

function formatOrderItemLine(item: OrderItem): string {
  if (item.productSlug && isPartyProductSlug(item.productSlug)) {
    const details = formatPartyItemSummary(item);
    return `${item.productName} × ${item.quantity}${details.length ? ` — ${details.join(" · ")}` : ""}`;
  }
  const parts = [item.productName + ` × ${item.quantity}`];
  if (item.flavor) parts.push(`Flavor: ${item.flavor}`);
  if (item.frosting) parts.push(`Frosting: ${item.frosting}`);
  if (item.designNotes) parts.push(item.designNotes);
  return parts.join(" — ");
}

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

  async function updateStatus(id: string, status: string, finalTotalCents?: number) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, finalTotalCents }),
    });
    router.refresh();
    setSelected(null);
  }

  return (
    <div className="mt-8 space-y-4">
      {initial.map((o) => (
        <div
          key={o.id}
          className={`card cursor-pointer ${o.status === "PENDING_REVIEW" ? "border-yellow-400 border-2" : ""}`}
          onClick={() => setSelected(o)}
        >
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold">{o.orderNumber}</p>
              <p className="text-sm text-[var(--warm-gray)]">{o.customerName} · {format(new Date(o.scheduledDate), "MMM d, yyyy")}</p>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-[var(--blush)] px-2 py-1 text-xs">{o.status.replace(/_/g, " ")}</span>
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
                  onClick={() => updateStatus(selected.id, "CONFIRMED", Math.round(parseFloat(finalPrice || String(selected.totalCents / 100)) * 100))}
                >
                  Confirm order
                </button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(statusActions[selected.status] ?? []).map((a) => (
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
