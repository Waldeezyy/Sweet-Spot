import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import type { QuoteRequest } from "@prisma/client";

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  QUOTE_REQUESTED: "Awaiting review",
  QUOTE_SENT: "Quote sent",
  PENDING_DEPOSIT: "Awaiting payment",
  CONVERTED: "Confirmed",
  DECLINED: "Declined",
};

export async function convertQuoteToOrder(
  quote: QuoteRequest,
  opts: { paidInFull: boolean; depositPercent: number; offlineNote?: string }
) {
  if (!quote.quotedPriceCents) throw new Error("Quote has no price");

  const totalCents = quote.quotedPriceCents;
  const depositCents = opts.paidInFull
    ? totalCents
    : Math.round(totalCents * (opts.depositPercent / 100));
  const balanceDueCents = totalCents - depositCents;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      status: "CONFIRMED",
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      fulfillmentType: "PICKUP",
      scheduledDate: quote.scheduledDate,
      subtotalCents: totalCents,
      totalCents,
      depositCents,
      balanceDueCents,
      paidInFull: opts.paidInFull,
      depositPaid: true,
      adminNotes: [
        `Custom quote — ${quote.occasion}`,
        quote.dietaryNotes ? `Dietary: ${quote.dietaryNotes}` : null,
        opts.offlineNote ? `Paid offline: ${opts.offlineNote}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      items: {
        create: {
          productName: `Custom order — ${quote.occasion}`,
          unitPriceCents: totalCents,
          quantity: 1,
          designNotes: quote.description,
          allergyNotes: quote.dietaryNotes,
          inspirationPhotos: quote.inspirationPhotos,
        },
      },
    },
  });

  await prisma.quoteRequest.update({
    where: { id: quote.id },
    data: {
      status: "CONVERTED",
      convertedOrderId: order.id,
      offlinePaymentNote: opts.offlineNote ?? null,
    },
  });

  return order;
}
