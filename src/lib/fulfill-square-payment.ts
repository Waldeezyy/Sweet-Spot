import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { sendOrderConfirmationFromOrder, sendAdminNewOrder } from "@/lib/email";
import { convertQuoteToOrder } from "@/lib/quotes";
import type { PaymentLinkMetadata } from "@/lib/square-payment-link";

export async function fulfillSquarePayment(
  meta: PaymentLinkMetadata,
  amountPaidCents: number,
  squarePaymentId?: string
) {
  if (meta.quoteId) {
    const existing = await prisma.quoteRequest.findUnique({ where: { id: meta.quoteId } });
    if (!existing || existing.status === "CONVERTED") return;

    const settings = await prisma.shopSettings.findFirst();
    const converted = await convertQuoteToOrder(existing, {
      paidInFull: meta.paidInFull,
      depositPercent: settings?.depositPercent ?? 25,
    });
    const order = await prisma.order.update({
      where: { id: converted.id },
      data: { squarePaymentId },
      include: { items: true },
    });
    await sendOrderConfirmationFromOrder(order, { fromCustomQuote: true });
    await sendAdminNewOrder({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      preferredContactMethod: order.preferredContactMethod,
      totalCents: order.totalCents,
      finalTotalCents: order.finalTotalCents,
      scheduledDate: format(order.scheduledDate, "EEEE, MMMM d, yyyy"),
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      paymentReceived: true,
    });
    return;
  }

  if (!meta.orderId) return;

  if (meta.paymentType === "balance") {
    const existing = await prisma.order.findUnique({ where: { id: meta.orderId } });
    if (existing && existing.balanceDueCents > 0) {
      await prisma.order.update({
        where: { id: meta.orderId },
        data: {
          balanceDueCents: 0,
          paidInFull: true,
          squarePaymentId,
        },
      });
    }
    return;
  }

  const existing = await prisma.order.findUnique({ where: { id: meta.orderId } });
  if (!existing) return;

  const orderTotal = existing.finalTotalCents ?? existing.totalCents;
  const depositCents = meta.paidInFull ? orderTotal : amountPaidCents;
  const balanceDueCents = meta.paidInFull ? 0 : Math.max(0, orderTotal - amountPaidCents);

  const order = await prisma.order.update({
    where: { id: meta.orderId },
    data: {
      depositPaid: true,
      paidInFull: meta.paidInFull,
      depositCents,
      balanceDueCents,
      finalTotalCents: existing.finalTotalCents ?? orderTotal,
      status: existing.status === "PENDING_REVIEW" ? "PENDING_REVIEW" : "CONFIRMED",
      squarePaymentId,
    },
    include: { items: true },
  });

  await sendOrderConfirmationFromOrder(order, {
    pendingReview: order.status === "PENDING_REVIEW",
  });

  await sendAdminNewOrder({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    preferredContactMethod: order.preferredContactMethod,
    totalCents: order.totalCents,
    finalTotalCents: order.finalTotalCents,
    scheduledDate: format(order.scheduledDate, "EEEE, MMMM d, yyyy"),
    fulfillmentType: order.fulfillmentType,
    deliveryAddress: order.deliveryAddress,
    items: order.items,
    pendingReview: order.status === "PENDING_REVIEW",
    paymentReceived: true,
  });
}
