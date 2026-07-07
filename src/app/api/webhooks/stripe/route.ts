import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendOrderConfirmation, sendAdminNewOrder } from "@/lib/email";
import { format } from "date-fns";

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
    if (orderId) {
      const existing = await prisma.order.findUnique({ where: { id: orderId } });
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          depositPaid: true,
          status: existing?.status === "PENDING_REVIEW" ? "PENDING_REVIEW" : "CONFIRMED",
          stripePaymentIntent: session.payment_intent as string,
        },
      });

      await sendOrderConfirmation({
        to: order.customerEmail,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        depositCents: order.depositCents,
        balanceDueCents: order.balanceDueCents,
        scheduledDate: format(order.scheduledDate, "MMM d, yyyy"),
        pendingReview: order.status === "PENDING_REVIEW",
        paidInFull: order.paidInFull,
      });

      await sendAdminNewOrder({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalCents: order.totalCents,
        pendingReview: order.status === "PENDING_REVIEW",
      });
    }
  }

  return NextResponse.json({ received: true });
}
