import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!stripe) {
    return NextResponse.json({ error: "Online payment not available" }, { status: 503 });
  }

  const { token } = await params;
  const order = await prisma.order.findUnique({ where: { trackingToken: token } });

  if (!order || order.status === "CANCELLED") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.depositPaid) {
    return NextResponse.json({ error: "Deposit must be paid first" }, { status: 400 });
  }

  if (order.balanceDueCents <= 0 || order.paidInFull) {
    return NextResponse.json({ error: "No balance due on this order" }, { status: 400 });
  }

  const siteUrl = await getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: order.balanceDueCents,
          product_data: {
            name: `Balance for order ${order.orderNumber}`,
            description: "B's Sweet Spot — remaining balance",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentType: "balance",
    },
    success_url: `${siteUrl}/order/status/${token}?balancePaid=1`,
    cancel_url: `${siteUrl}/order/status/${token}`,
  });

  return NextResponse.json({ url: session.url });
}
