"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/utils";
import { format } from "date-fns";

type Quote = {
  id: string;
  status: string;
  customerName: string;
  customerEmail: string;
  occasion: string;
  scheduledDate: string;
  description: string;
  servings: number | null;
  budgetRange: string | null;
  quotedPriceCents: number | null;
};

export function CustomRequestsManager({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Quote | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  async function sendQuote() {
    if (!selected) return;
    await fetch(`/api/admin/quotes/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_quote",
        quotedPriceCents: Math.round(parseFloat(price) * 100),
        quoteMessage: message,
      }),
    });
    setSelected(null);
    router.refresh();
  }

  async function decline() {
    if (!selected || !confirm("Decline this request?")) return;
    await fetch(`/api/admin/quotes/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline", declineMessage: message }),
    });
    setSelected(null);
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-4">
      {quotes.length === 0 && <p className="text-[var(--warm-gray)]">No custom requests yet.</p>}
      {quotes.map((q) => (
        <div key={q.id} className="card cursor-pointer" onClick={() => setSelected(q)}>
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{q.customerName}</p>
              <p className="text-sm text-[var(--warm-gray)]">{q.occasion} · {format(new Date(q.scheduledDate), "MMM d, yyyy")}</p>
            </div>
            <span className="text-xs text-[var(--warm-gray)]">{q.status.replace(/_/g, " ")}</span>
          </div>
        </div>
      ))}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card max-w-lg">
            <h3 className="font-semibold">{selected.customerName}</h3>
            <p className="text-sm text-[var(--warm-gray)]">{selected.customerEmail}</p>
            <p className="mt-4 text-sm">{selected.description}</p>
            {selected.status === "QUOTE_REQUESTED" && (
              <>
                <div className="mt-4">
                  <label className="label">Quote price ($)</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
                </div>
                <div className="mt-2">
                  <label className="label">Personal message (optional)</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input min-h-[80px]" />
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={sendQuote} className="btn-primary flex-1">Send Quote</button>
                  <button type="button" onClick={decline} className="btn-secondary">Decline</button>
                  <button type="button" onClick={() => setSelected(null)} className="btn-secondary">Close</button>
                </div>
              </>
            )}
            {selected.quotedPriceCents && (
              <p className="mt-4 font-semibold">Quoted: {formatCents(selected.quotedPriceCents)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
