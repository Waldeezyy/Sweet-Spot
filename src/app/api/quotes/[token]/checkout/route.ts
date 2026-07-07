import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { square } from "@/lib/square";
import { getSiteUrl } from "@/lib/site-url";
import { createSquarePaymentLink } from "@/lib/square-payment-link";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!square) {
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
  const { url } = await createSquarePaymentLink({
    name: paidInFull ? "Custom order — paid in full" : "Custom order deposit",
    chargeCents,
    redirectUrl: `${siteUrl}/quote/success?token=${token}`,
    buyerEmail: quote.customerEmail,
    metadata: {
      quoteId: quote.id,
      paymentType: "deposit",
      paidInFull,
    },
  });

  await prisma.quoteRequest.update({
    where: { id: quote.id },
    data: { status: "PENDING_DEPOSIT" },
  });

  return NextResponse.json({ url });
}
