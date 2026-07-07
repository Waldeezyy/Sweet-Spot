import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { QuotePayForm } from "@/components/quote/QuotePayForm";
import { stripe } from "@/lib/stripe";

export default async function QuotePayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await prisma.quoteRequest.findUnique({ where: { paymentToken: token } });
  if (!quote || !quote.quotedPriceCents) notFound();

  if (quote.status === "CONVERTED") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--sage)]">Quote approved</h1>
        <p className="mt-4 text-[var(--warm-gray)]">This quote has already been confirmed. Thank you!</p>
        <Link href={`/quote/status/${token}`} className="btn-primary mt-8 inline-flex">
          View quote status
        </Link>
      </div>
    );
  }

  if (quote.status === "DECLINED") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Quote unavailable</h1>
        <p className="mt-4 text-[var(--warm-gray)]">This request is no longer active.</p>
        <Link href="/custom-order" className="btn-secondary mt-8 inline-flex">Submit a new request</Link>
      </div>
    );
  }

  const settings = await prisma.shopSettings.findFirst();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Your Custom Quote</h1>
      <p className="mt-2 text-sm text-[var(--warm-gray)]">
        {quote.occasion} · {format(quote.scheduledDate, "MMMM d, yyyy")}
      </p>
      <QuotePayForm
        token={token}
        customerName={quote.customerName}
        quotedPriceCents={quote.quotedPriceCents}
        depositPercent={settings?.depositPercent ?? 25}
        quoteMessage={quote.quoteMessage}
        stripeEnabled={Boolean(stripe)}
      />
      <Link href={`/quote/status/${token}`} className="mt-4 block text-center text-sm text-[var(--rose)] hover:underline">
        View quote status
      </Link>
    </div>
  );
}
