import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { square } from "@/lib/square";
import { getSiteUrl } from "@/lib/site-url";
import { getPaymentPolicyForTotal, resolveCheckoutPayment } from "@/lib/payment-policy";
import { createSquarePaymentLink } from "@/lib/square-payment-link";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!square) {
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
  const { url, paymentLinkId } = await createSquarePaymentLink({
    name: `Order ${order.orderNumber} — ${chargeLabel}`,
    chargeCents: payment.chargeCents,
    redirectUrl: `${siteUrl}/order/success?order=${order.orderNumber}`,
    buyerEmail: order.customerEmail,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentType: "deposit",
      paidInFull: payment.paidInFull,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      squarePaymentLinkId: paymentLinkId,
      depositCents: payment.depositCents,
      balanceDueCents: payment.balanceDueCents,
      paidInFull: payment.paidInFull,
    },
  });

  return NextResponse.json({ url });
}
