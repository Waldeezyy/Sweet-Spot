import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { sendQuoteToCustomer } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = z.object({
    action: z.enum(["send_quote", "decline"]),
    quotedPriceCents: z.number().int().optional(),
    quoteMessage: z.string().optional(),
    declineMessage: z.string().optional(),
  }).parse(await req.json());

  if (body.action === "decline") {
    const quote = await prisma.quoteRequest.update({
      where: { id },
      data: { status: "DECLINED", declineMessage: body.declineMessage },
    });
    return NextResponse.json(quote);
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
  await sendQuoteToCustomer({
    to: quote.customerEmail,
    customerName: quote.customerName,
    quotedPriceCents: body.quotedPriceCents!,
    message: body.quoteMessage,
    paymentUrl: `${siteUrl}/quote/pay/${token}`,
  });

  return NextResponse.json(quote);
}
