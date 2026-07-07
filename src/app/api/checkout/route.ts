import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";
import { generateOrderNumber, formatCents } from "@/lib/utils";
import { hasSemiCustom, type CartItem } from "@/lib/cart";
import { getPaymentPolicy, resolveCheckoutPayment } from "@/lib/payment-policy";
import { sendOrderConfirmationFromOrder, sendAdminNewOrder } from "@/lib/email";
import { isPastScheduledDate, isRushOrderDate, RUSH_FEE_CENTS } from "@/lib/rush-order";

const schema = z.object({
  items: z.array(z.any()),
  meta: z.object({
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
    deliveryAddress: z.string().optional(),
    scheduledDate: z.string(),
    customerName: z.string(),
    customerEmail: z.string().email(),
    customerPhone: z.string().optional(),
  }),
  totalCents: z.number(),
  deliveryFeeCents: z.number(),
  paymentChoice: z.enum(["deposit", "full"]).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid order data" }, { status: 400 });

  const { items, meta, totalCents, deliveryFeeCents, paymentChoice = "deposit" } = parsed.data;
  const settings = await prisma.shopSettings.findFirst();
  if (!settings) return NextResponse.json({ error: "Shop not configured" }, { status: 500 });

  const subtotal = items.reduce((s: number, i: CartItem) => s + i.unitPriceCents * i.quantity, 0);
  if (subtotal < settings.orderMinimumCents) {
    return NextResponse.json({ error: "Order below minimum" }, { status: 400 });
  }

  if (isPastScheduledDate(meta.scheduledDate)) {
    return NextResponse.json({ error: "Please pick today or a future date." }, { status: 400 });
  }

  const isRush = isRushOrderDate(meta.scheduledDate, settings.leadTimeDays);

  const policy = getPaymentPolicy(items as CartItem[], totalCents, {
    depositPercent: settings.depositPercent,
    fullPaymentThresholdCents: settings.fullPaymentThresholdCents,
  });

  const payment = resolveCheckoutPayment(
    policy.payInFullOnly ? "full" : paymentChoice,
    policy
  );

  const orderNumber = generateOrderNumber();
  const needsReview = hasSemiCustom(items as CartItem[]) || isRush;
  const status = needsReview ? "PENDING_REVIEW" : payment.paidInFull ? "CONFIRMED" : "PENDING_DEPOSIT";

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status,
      customerName: meta.customerName,
      customerEmail: meta.customerEmail,
      customerPhone: meta.customerPhone,
      fulfillmentType: meta.fulfillmentType,
      deliveryAddress: meta.deliveryAddress,
      scheduledDate: new Date(meta.scheduledDate),
      adminNotes: isRush ? `Rush order — requires approval. ${formatCents(RUSH_FEE_CENTS)} rush fee applies if approved.` : undefined,
      subtotalCents: subtotal,
      deliveryFeeCents,
      totalCents,
      depositCents: payment.depositCents,
      balanceDueCents: payment.balanceDueCents,
      paidInFull: payment.paidInFull,
      items: {
        create: (items as CartItem[]).map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
          flavor: item.flavor,
          frosting: item.frosting,
          toppings: item.toppings?.join(", "),
          writing: item.writing,
          designNotes: item.designNotes,
          allergyNotes: item.allergyNotes,
          inspirationPhotos: item.inspirationPhotos ?? [],
        })),
      },
    },
    include: { items: true },
  });

  const chargeLabel = payment.paidInFull ? "Payment" : "Deposit";

  if (!stripe) {
    const paid = await prisma.order.update({
      where: { id: order.id },
      data: {
        depositPaid: true,
        status: needsReview ? "PENDING_REVIEW" : "CONFIRMED",
      },
      include: { items: true },
    });
    await sendOrderConfirmationFromOrder(paid, {
      pendingReview: paid.status === "PENDING_REVIEW",
    });
    await sendAdminNewOrder({
      orderNumber: paid.orderNumber,
      customerName: paid.customerName,
      totalCents: paid.totalCents,
      pendingReview: paid.status === "PENDING_REVIEW",
    });
    return NextResponse.json({ url: `/order/success?order=${orderNumber}&demo=1` });
  }

  const siteUrl = await getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: meta.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: payment.chargeCents,
          product_data: {
            name: `${chargeLabel} for order ${orderNumber}`,
            description: payment.paidInFull
              ? "B's Sweet Spot — paid in full"
              : `B's Sweet Spot — ${settings.depositPercent}% deposit`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order.id,
      orderNumber,
      paidInFull: payment.paidInFull ? "true" : "false",
      paymentType: "deposit",
    },
    success_url: `${siteUrl}/order/success?order=${orderNumber}`,
    cancel_url: `${siteUrl}/order?cancelled=1`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
