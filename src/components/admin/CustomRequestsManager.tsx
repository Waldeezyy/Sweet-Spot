"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/utils";
import { format } from "date-fns";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes";
import { preferredContactLabel } from "@/lib/preferred-contact";

type Quote = {
  id: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  preferredContactMethod: "EMAIL" | "PHONE" | "EITHER" | null;
  occasion: string;
  scheduledDate: string;
  description: string;
  servings: number | null;
  budgetRange: string | null;
  dietaryNotes: string | null;
  quotedPriceCents: number | null;
  paymentToken: string | null;
  offlinePaymentNote: string | null;
};

export function CustomRequestsManager({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Quote | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [offlineNote, setOfflineNote] = useState("");
  const [toast, setToast] = useState("");
  const [lastLinks, setLastLinks] = useState<{ pay?: string; status?: string } | null>(null);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  }

  async function sendQuote() {
    if (!selected) return;
    const res = await fetch(`/api/admin/quotes/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_quote",
        quotedPriceCents: Math.round(parseFloat(price) * 100),
        quoteMessage: message,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setLastLinks({ pay: data.paymentUrl, status: data.statusUrl });
      notify("Quote sent by email (if Resend is on). Copy the link below for Facebook or text.");
      router.refresh();
    }
  }

  async function decline() {
    if (!selected || !confirm("Decline this request? The customer will be emailed if Resend is configured.")) return;
    await fetch(`/api/admin/quotes/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline", declineMessage: message }),
    });
    setSelected(null);
    notify("Request declined.");
    router.refresh();
  }

  async function markPaidOffline(paidInFull: boolean) {
    if (!selected) return;
    const note = offlineNote.trim() || (paidInFull ? "Paid in full offline" : "Deposit paid offline");
    await fetch(`/api/admin/quotes/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_paid_offline",
        paidInFull,
        offlineNote: note,
      }),
    });
    setSelected(null);
    notify("Marked as paid offline — order created in your Orders inbox.");
    router.refresh();
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    notify("Link copied!");
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const payUrl =
    lastLinks?.pay ??
    (selected?.paymentToken && origin ? `${origin}/quote/pay/${selected.paymentToken}` : null);
  const statusUrl =
    lastLinks?.status ??
    (selected?.paymentToken && origin ? `${origin}/quote/status/${selected.paymentToken}` : null);

  return (
    <div className="mt-8 space-y-4">
      {toast && <div className="rounded-xl bg-[var(--sage)]/20 p-3 text-sm">{toast}</div>}
      {quotes.length === 0 && <p className="text-[var(--warm-gray)]">No custom requests yet.</p>}
      {quotes.map((q) => (
        <div
          key={q.id}
          className={`card cursor-pointer ${q.status === "QUOTE_REQUESTED" ? "border-yellow-400 border-2" : ""}`}
          onClick={() => {
            setSelected(q);
            setLastLinks(null);
            setOfflineNote("");
          }}
        >
          <div className="flex justify-between gap-2">
            <div>
              <p className="font-semibold">{q.customerName}</p>
              <p className="text-sm text-[var(--warm-gray)]">
                {q.occasion} · {format(new Date(q.scheduledDate), "MMM d, yyyy")}
              </p>
            </div>
            <span className="shrink-0 text-xs text-[var(--warm-gray)]">
              {QUOTE_STATUS_LABELS[q.status] ?? q.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      ))}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card max-h-[90vh] max-w-lg overflow-y-auto">
            <h3 className="font-semibold">{selected.customerName}</h3>
            <p className="text-sm">
              <a href={`mailto:${selected.customerEmail}`} className="text-[var(--rose)] hover:underline">
                {selected.customerEmail}
              </a>
            </p>
            {selected.customerPhone && (
              <p className="mt-2">
                <a href={`tel:${selected.customerPhone}`} className="btn-secondary inline-flex text-sm">
                  Call / text {selected.customerPhone}
                </a>
              </p>
            )}
            {preferredContactLabel(selected.preferredContactMethod) && (
              <p className="mt-2 text-sm text-[var(--warm-gray)]">
                Preferred contact: <strong>{preferredContactLabel(selected.preferredContactMethod)}</strong>
              </p>
            )}
            <p className="mt-4 text-sm whitespace-pre-line">{selected.description}</p>
            {selected.dietaryNotes && (
              <p className="mt-2 text-sm text-[var(--warm-gray)]">Dietary: {selected.dietaryNotes}</p>
            )}
            {selected.budgetRange && (
              <p className="text-sm text-[var(--warm-gray)]">Budget: {selected.budgetRange}</p>
            )}

            {selected.status === "QUOTE_REQUESTED" && (
              <>
                <div className="mt-4">
                  <label className="label">Quote price ($)</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
                </div>
                <div className="mt-2">
                  <label className="label">Personal message (optional)</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input min-h-[80px]" placeholder="Details, pickup time, etc." />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={sendQuote} className="btn-primary flex-1">Send quote</button>
                  <button type="button" onClick={decline} className="btn-secondary">Decline</button>
                  <button type="button" onClick={() => setSelected(null)} className="btn-secondary">Close</button>
                </div>
              </>
            )}

            {(payUrl || statusUrl) && selected.paymentToken && selected.status !== "CONVERTED" && (
              <div className="mt-4 space-y-2 rounded-xl bg-[var(--blush)]/30 p-4 text-sm">
                <p className="font-medium">Share with customer</p>
                {payUrl && (
                  <button type="button" onClick={() => copyLink(payUrl)} className="btn-secondary w-full text-left text-sm">
                    Copy pay link
                  </button>
                )}
                {statusUrl && (
                  <button type="button" onClick={() => copyLink(statusUrl)} className="btn-secondary w-full text-left text-sm">
                    Copy status link
                  </button>
                )}
              </div>
            )}

            {(selected.status === "QUOTE_SENT" || selected.status === "PENDING_DEPOSIT") && (
              <div className="mt-4 border-t border-[var(--blush)] pt-4">
                <p className="font-medium">Paid offline (Venmo / Cash App / cash)?</p>
                {selected.quotedPriceCents && (
                  <p className="text-sm text-[var(--warm-gray)]">Quoted: {formatCents(selected.quotedPriceCents)}</p>
                )}
                <input
                  value={offlineNote}
                  onChange={(e) => setOfflineNote(e.target.value)}
                  className="input mt-2"
                  placeholder="e.g. Venmo @customer — $50 deposit"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => markPaidOffline(false)} className="btn-primary text-sm">
                    Mark deposit paid offline
                  </button>
                  <button type="button" onClick={() => markPaidOffline(true)} className="btn-secondary text-sm">
                    Mark paid in full offline
                  </button>
                </div>
              </div>
            )}

            {selected.status === "CONVERTED" && (
              <p className="mt-4 font-semibold text-[var(--sage)]">Confirmed — see Orders inbox</p>
            )}
            {selected.quotedPriceCents && selected.status !== "QUOTE_REQUESTED" && (
              <p className="mt-4 font-semibold">Quoted: {formatCents(selected.quotedPriceCents)}</p>
            )}
            {selected.offlinePaymentNote && (
              <p className="text-sm text-[var(--warm-gray)]">{selected.offlinePaymentNote}</p>
            )}
            {selected.status !== "QUOTE_REQUESTED" && (
              <button type="button" onClick={() => setSelected(null)} className="btn-secondary mt-4 text-sm">
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
