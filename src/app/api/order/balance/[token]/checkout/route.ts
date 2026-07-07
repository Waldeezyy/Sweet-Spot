import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { square } from "@/lib/square";
import { getSiteUrl } from "@/lib/site-url";
import { createSquarePaymentLink } from "@/lib/square-payment-link";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!square) {
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
  const { url } = await createSquarePaymentLink({
    name: `Balance for order ${order.orderNumber}`,
    chargeCents: order.balanceDueCents,
    redirectUrl: `${siteUrl}/order/status/${token}?balancePaid=1`,
    buyerEmail: order.customerEmail,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentType: "balance",
      paidInFull: true,
    },
  });

  return NextResponse.json({ url });
}
