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

  const order = await prisma.order.findUnique({ where: { paymentToken: token } });
  if (!order || !order.finalTotalCents || order.status !== "PENDING_DEPOSIT" || order.depositPaid) {
    return NextResponse.json({ error: "Order not available for payment" }, { status: 404 });
  }

  const settings = await prisma.shopSettings.findFirst();
  const depositPercent = settings?.depositPercent ?? 25;
  const paidInFull = paymentChoice === "full";
  const chargeCents = paidInFull
    ? order.finalTotalCents
    : Math.round(order.finalTotalCents * (depositPercent / 100));

  const siteUrl = await getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: chargeCents,
          product_data: {
            name: paidInFull ? `Order ${order.orderNumber} — paid in full` : `Order ${order.orderNumber} — deposit`,
            description: `B's Sweet Spot rush order (includes rush fee)`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paidInFull: paidInFull ? "true" : "false",
      paymentType: "deposit",
    },
    success_url: `${siteUrl}/order/success?order=${order.orderNumber}`,
    cancel_url: `${siteUrl}/order/pay/${token}`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
