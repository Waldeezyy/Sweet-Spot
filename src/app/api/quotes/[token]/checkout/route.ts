import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!stripe) {
    return NextResponse.json({ error: "Online payment not available" }, { status: 503 });
  }

  const { token } = await params;
  const { paymentChoice } = z.object({ paymentChoice: z.enum(["deposit", "full"]) }).parse(await req.json());

  const quote = await prisma.quoteRequest.findUnique({ where: { paymentToken: token } });
  if (!quote || !quote.quotedPriceCents || quote.status === "CONVERTED" || quote.status === "DECLINED") {
    return NextResponse.json({ error: "Quote not available" }, { status: 404 });
  }

  const settings = await prisma.shopSettings.findFirst();
  const depositPercent = settings?.depositPercent ?? 25;
  const paidInFull = paymentChoice === "full";
  const chargeCents = paidInFull
    ? quote.quotedPriceCents
    : Math.round(quote.quotedPriceCents * (depositPercent / 100));

  const siteUrl = await getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: quote.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: chargeCents,
          product_data: {
            name: paidInFull ? "Custom order — paid in full" : "Custom order deposit",
            description: `B's Sweet Spot — ${quote.occasion}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      quoteId: quote.id,
      paidInFull: paidInFull ? "true" : "false",
    },
    success_url: `${siteUrl}/quote/success?token=${token}`,
    cancel_url: `${siteUrl}/quote/pay/${token}`,
  });

  await prisma.quoteRequest.update({
    where: { id: quote.id },
    data: { status: "PENDING_DEPOSIT" },
  });

  return NextResponse.json({ url: session.url });
}
