import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";
import { getPaymentPolicyForTotal, resolveCheckoutPayment } from "@/lib/payment-policy";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!stripe) {
    return NextResponse.json({ error: "Online payment not available" }, { status: 503 });
  }

  const { token } = await params;
  const { paymentChoice } = z.object({ paymentChoice: z.enum(["deposit", "full"]) }).parse(await req.json());

  const order = await prisma.order.findUnique({
    where: { paymentToken: token },
    include: { items: true },
  });
  if (!order || !order.finalTotalCents || order.status !== "PENDING_DEPOSIT" || order.depositPaid) {
    return NextResponse.json({ error: "Order not available for payment" }, { status: 404 });
  }

  const settings = await prisma.shopSettings.findFirst();
  const productIds = order.items.map((item) => item.productId).filter((id): id is string => Boolean(id));
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, orderType: true },
        })
      : [];
  const semiCustom = products.some((p) => p.orderType === "SEMI_CUSTOM");

  const policy = getPaymentPolicyForTotal(order.finalTotalCents, semiCustom, {
    depositPercent: settings?.depositPercent ?? 25,
    fullPaymentThresholdCents: settings?.fullPaymentThresholdCents ?? 7500,
  });

  const payment = resolveCheckoutPayment(
    policy.payInFullOnly ? "full" : paymentChoice,
    policy
  );

  const siteUrl = await getSiteUrl();
  const chargeLabel = payment.paidInFull ? "paid in full" : "deposit";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: payment.chargeCents,
          product_data: {
            name: `Order ${order.orderNumber} — ${chargeLabel}`,
            description: `B's Sweet Spot rush order (includes rush fee)`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paidInFull: payment.paidInFull ? "true" : "false",
      paymentType: "deposit",
    },
    success_url: `${siteUrl}/order/success?order=${order.orderNumber}`,
    cancel_url: `${siteUrl}/order/pay/${token}`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripeSessionId: session.id,
      depositCents: payment.depositCents,
      balanceDueCents: payment.balanceDueCents,
      paidInFull: payment.paidInFull,
    },
  });

  return NextResponse.json({ url: session.url });
}
