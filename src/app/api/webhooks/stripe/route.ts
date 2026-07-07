import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendOrderConfirmationFromOrder, sendAdminNewOrder } from "@/lib/email";
import { convertQuoteToOrder } from "@/lib/quotes";

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ received: true });

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const quoteId = session.metadata?.quoteId;

    if (quoteId) {
      const existing = await prisma.quoteRequest.findUnique({ where: { id: quoteId } });
      if (existing && existing.status !== "CONVERTED") {
        const settings = await prisma.shopSettings.findFirst();
        const paidInFull = session.metadata?.paidInFull === "true";
        const converted = await convertQuoteToOrder(existing, {
          paidInFull,
          depositPercent: settings?.depositPercent ?? 25,
        });
        const order = await prisma.order.update({
          where: { id: converted.id },
          data: { stripePaymentIntent: session.payment_intent as string },
          include: { items: true },
        });
        await sendOrderConfirmationFromOrder(order, { fromCustomQuote: true });
        await sendAdminNewOrder({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalCents: order.totalCents,
        });
      }
    } else if (orderId) {
      const paymentType = session.metadata?.paymentType ?? "deposit";

      if (paymentType === "balance") {
        const existing = await prisma.order.findUnique({ where: { id: orderId } });
        if (existing && existing.balanceDueCents > 0) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              balanceDueCents: 0,
              paidInFull: true,
              stripePaymentIntent: session.payment_intent as string,
            },
          });
        }
      } else {
        const existing = await prisma.order.findUnique({ where: { id: orderId } });
        if (!existing) return NextResponse.json({ received: true });

        const paidInFull = session.metadata?.paidInFull === "true";
        const amountPaid = session.amount_total ?? 0;
        const orderTotal = existing.finalTotalCents ?? existing.totalCents;
        const depositCents = paidInFull ? orderTotal : amountPaid;
        const balanceDueCents = paidInFull ? 0 : Math.max(0, orderTotal - amountPaid);

        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            depositPaid: true,
            paidInFull,
            depositCents,
            balanceDueCents,
            finalTotalCents: existing.finalTotalCents ?? orderTotal,
            status: existing.status === "PENDING_REVIEW" ? "PENDING_REVIEW" : "CONFIRMED",
            stripePaymentIntent: session.payment_intent as string,
          },
          include: { items: true },
        });

        await sendOrderConfirmationFromOrder(order, {
          pendingReview: order.status === "PENDING_REVIEW",
        });

        await sendAdminNewOrder({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalCents: order.totalCents,
          pendingReview: order.status === "PENDING_REVIEW",
        });
      }
    } else {
      console.warn("[stripe webhook] checkout.session.completed with no orderId or quoteId", {
        sessionId: session.id,
        metadata: session.metadata,
      });
    }
  }

  return NextResponse.json({ received: true });
}
