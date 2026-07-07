import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes";

const STEPS = [
  { key: "QUOTE_SENT", label: "Quote sent" },
  { key: "PENDING_DEPOSIT", label: "Payment started" },
  { key: "CONVERTED", label: "Confirmed" },
];

export default async function QuoteStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await prisma.quoteRequest.findUnique({
    where: { paymentToken: token },
  });
  if (!quote) notFound();

  const order = quote.convertedOrderId
    ? await prisma.order.findUnique({ where: { id: quote.convertedOrderId } })
    : null;

  const currentIndex =
    quote.status === "CONVERTED"
      ? 3
      : quote.status === "PENDING_DEPOSIT"
        ? 2
        : quote.status === "QUOTE_SENT"
          ? 1
          : 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Quote status</h1>
      <p className="mt-2 text-[var(--warm-gray)]">
        {quote.occasion} · {format(quote.scheduledDate, "MMMM d, yyyy")}
      </p>

      {quote.status === "DECLINED" ? (
        <div className="card mt-8 border-red-200 bg-red-50">
          <p className="font-semibold text-red-800">This request was declined.</p>
          {quote.declineMessage && <p className="mt-2 text-sm">{quote.declineMessage}</p>}
        </div>
      ) : quote.status === "QUOTE_REQUESTED" ? (
        <div className="card mt-8">
          <p className="font-semibold">{QUOTE_STATUS_LABELS.QUOTE_REQUESTED}</p>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">
            Brandy is reviewing your request and will send a quote soon.
          </p>
        </div>
      ) : (
        <div className="card mt-8">
          <p className="mb-4 font-semibold text-[var(--sage)]">
            {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
          </p>
          <ol className="space-y-3">
            {STEPS.map((step, i) => {
              const done = currentIndex > i;
              const active = currentIndex === i + 1;
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      done ? "bg-[var(--sage)] text-white" : "bg-[var(--blush)] text-[var(--warm-gray)]"
                    } ${active ? "ring-2 ring-[var(--sage)] ring-offset-2" : ""}`}
                  >
                    {i + 1}
                  </span>
                  <span className={done ? "font-medium" : "text-[var(--warm-gray)]"}>{step.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {quote.quotedPriceCents && (
        <div className="card mt-6 text-sm">
          <p className="font-semibold">Quoted price: {formatCents(quote.quotedPriceCents)}</p>
          {quote.quoteMessage && <p className="mt-2 text-[var(--warm-gray)]">{quote.quoteMessage}</p>}
          {quote.offlinePaymentNote && (
            <p className="mt-2 text-[var(--warm-gray)]">Payment note: {quote.offlinePaymentNote}</p>
          )}
        </div>
      )}

      {quote.status === "QUOTE_SENT" || quote.status === "PENDING_DEPOSIT" ? (
        <Link href={`/quote/pay/${token}`} className="btn-primary mt-8 inline-flex">
          Review & pay online
        </Link>
      ) : null}

      {order && (
        <Link href={`/order/status/${order.trackingToken}`} className="btn-secondary mt-4 inline-flex">
          Track your order ({order.orderNumber})
        </Link>
      )}

      <Link href="/" className="mt-4 block text-sm text-[var(--rose)] hover:underline">
        Back to home
      </Link>
    </div>
  );
}
