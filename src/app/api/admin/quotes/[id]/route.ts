import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { sendQuoteToCustomer, sendQuoteDeclined, sendOrderConfirmationFromOrder } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { convertQuoteToOrder } from "@/lib/quotes";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = z
    .object({
      action: z.enum(["send_quote", "decline", "mark_paid_offline"]),
      quotedPriceCents: z.number().int().optional(),
      quoteMessage: z.string().optional(),
      declineMessage: z.string().optional(),
      paidInFull: z.boolean().optional(),
      offlineNote: z.string().optional(),
    })
    .parse(await req.json());

  const settings = await prisma.shopSettings.findFirst();
  const depositPercent = settings?.depositPercent ?? 25;

  if (body.action === "decline") {
    const quote = await prisma.quoteRequest.update({
      where: { id },
      data: { status: "DECLINED", declineMessage: body.declineMessage },
    });
    await sendQuoteDeclined({
      to: quote.customerEmail,
      customerName: quote.customerName,
      message: body.declineMessage,
    });
    return NextResponse.json(quote);
  }

  if (body.action === "mark_paid_offline") {
    const quote = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote?.quotedPriceCents) {
      return NextResponse.json({ error: "Send a quote with a price first" }, { status: 400 });
    }
    if (quote.status === "CONVERTED") {
      return NextResponse.json({ error: "Already converted" }, { status: 400 });
    }
    const order = await convertQuoteToOrder(quote, {
      paidInFull: body.paidInFull ?? false,
      depositPercent,
      offlineNote: body.offlineNote,
    });
    const orderWithItems = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    await sendOrderConfirmationFromOrder(orderWithItems, { fromCustomQuote: true });
    const updated = await prisma.quoteRequest.findUnique({ where: { id } });
    return NextResponse.json(updated);
  }

  const token = randomUUID();
  const quote = await prisma.quoteRequest.update({
    where: { id },
    data: {
      status: "QUOTE_SENT",
      quotedPriceCents: body.quotedPriceCents,
      quoteMessage: body.quoteMessage,
      paymentToken: token,
    },
  });

  const siteUrl = await getSiteUrl();
  const paymentUrl = `${siteUrl}/quote/pay/${token}`;
  const statusUrl = `${siteUrl}/quote/status/${token}`;

  await sendQuoteToCustomer({
    to: quote.customerEmail,
    customerName: quote.customerName,
    quotedPriceCents: body.quotedPriceCents!,
    message: body.quoteMessage,
    paymentUrl,
    statusUrl,
  });

  return NextResponse.json({ ...quote, paymentUrl, statusUrl });
}
