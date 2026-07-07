import { prisma } from "@/lib/db";
import { stripe, getSiteUrl } from "@/lib/stripe";
import { notFound } from "next/navigation";
import { formatCents } from "@/lib/utils";

export default async function QuotePayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await prisma.quoteRequest.findUnique({ where: { paymentToken: token } });
  if (!quote || !quote.quotedPriceCents) notFound();

  const settings = await prisma.shopSettings.findFirst();
  const depositCents = Math.round(quote.quotedPriceCents * ((settings?.depositPercent ?? 25) / 100));

  async function payDeposit() {
    "use server";
    const q = await prisma.quoteRequest.findUnique({ where: { paymentToken: token } });
    if (!q || !q.quotedPriceCents || !stripe) return;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: q.customerEmail,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: Math.round(q.quotedPriceCents * ((settings?.depositPercent ?? 25) / 100)),
          product_data: { name: "Custom order deposit — B's Sweet Spot" },
        },
        quantity: 1,
      }],
      metadata: { quoteId: q.id },
      success_url: `${getSiteUrl()}/quote/success?token=${token}`,
      cancel_url: `${getSiteUrl()}/quote/pay/${token}`,
    });

    if (session.url) {
      const { redirect } = await import("next/navigation");
      redirect(session.url);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Your Custom Quote</h1>
      <div className="card mt-6">
        <p>Hi {quote.customerName},</p>
        <p className="mt-4">Your quoted price: <strong>{formatCents(quote.quotedPriceCents)}</strong></p>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">Deposit ({settings?.depositPercent}%): {formatCents(depositCents)}</p>
        {quote.quoteMessage && <p className="mt-4 text-sm italic">{quote.quoteMessage}</p>}
        <form action={payDeposit} className="mt-6">
          <button type="submit" className="btn-primary w-full">
            Approve & Pay {formatCents(depositCents)} Deposit
          </button>
        </form>
      </div>
    </div>
  );
}
