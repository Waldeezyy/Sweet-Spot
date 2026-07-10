import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { square } from "@/lib/square";
import { createSquarePaymentLink } from "@/lib/square-payment-link";
import { getSiteUrl } from "@/lib/site-url";
import { generateOrderNumber } from "@/lib/utils";
import { hasSemiCustom, type CartItem } from "@/lib/cart";
import { getPaymentPolicy, resolveCheckoutPayment } from "@/lib/payment-policy";
import {
  sendOrderConfirmationFromOrder,
  sendAdminNewOrder,
  sendRushRequestToAdmin,
  sendRushRequestReceived,
  sendCustomOrderRequestReceived,
  sendCustomOrderRequestToAdmin,
} from "@/lib/email";
import { isPastScheduledDate, isRushOrderDate } from "@/lib/rush-order";
import {
  hasMultipleContactMethods,
  normalizePreferredContact,
  preferredContactMethodSchema,
} from "@/lib/preferred-contact";
import { normalizePortionsToLegacyFields } from "@/lib/order-portions";

function mapCartItemToOrderItem(item: CartItem) {
  const legacyFromPortions =
    item.portions?.length ? normalizePortionsToLegacyFields(item.portions) : null;
  return {
    productId: item.productId,
    productName: item.productName,
    productSlug: item.productSlug,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
    flavor: legacyFromPortions?.flavor ?? item.flavor,
    frosting: legacyFromPortions?.frosting ?? item.frosting,
    toppings: legacyFromPortions?.toppings ?? item.toppings?.join(", ") ?? item.addOns?.join(", "),
    writing: legacyFromPortions?.writing ?? item.writing,
    designNotes: item.designNotes,
    allergyNotes: item.allergyNotes,
    inspirationPhotos: item.inspirationPhotos ?? [],
    portions: item.portions?.length ? item.portions : undefined,
  };
}

const schema = z.object({
  items: z.array(z.any()),
  meta: z
    .object({
      fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
      deliveryAddress: z.string().optional(),
      scheduledDate: z.string(),
      customerName: z.string(),
      customerEmail: z.string().email(),
      customerPhone: z.string().optional(),
      preferredContactMethod: preferredContactMethodSchema.optional(),
    })
    .superRefine((meta, ctx) => {
      if (hasMultipleContactMethods(meta.customerPhone) && !meta.preferredContactMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Preferred contact method is required when a phone number is provided.",
          path: ["preferredContactMethod"],
        });
      }
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
  const semiCustom = hasSemiCustom(items as CartItem[]);
  const reviewFirstNoPayment = semiCustom || isRush;

  const orderNumber = generateOrderNumber();

  if (reviewFirstNoPayment) {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING_REVIEW",
        isRush,
        customerName: meta.customerName,
        customerEmail: meta.customerEmail,
        customerPhone: meta.customerPhone,
        preferredContactMethod: normalizePreferredContact(
          meta.customerPhone,
          meta.preferredContactMethod
        ),
        fulfillmentType: meta.fulfillmentType,
        deliveryAddress: meta.deliveryAddress,
        scheduledDate: new Date(meta.scheduledDate),
        subtotalCents: subtotal,
        deliveryFeeCents,
        totalCents,
        depositCents: 0,
        balanceDueCents: 0,
        paidInFull: false,
        depositPaid: false,
        items: {
          create: (items as CartItem[]).map((item) => mapCartItemToOrderItem(item)),
        },
      },
      include: { items: true },
    });

    const scheduledLabel = format(new Date(meta.scheduledDate), "MMM d, yyyy");

    if (semiCustom) {
      await sendCustomOrderRequestReceived({
        to: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        scheduledDate: scheduledLabel,
        trackingToken: order.trackingToken,
        isRush,
      });
      await sendCustomOrderRequestToAdmin({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        preferredContactMethod: order.preferredContactMethod,
        scheduledDate: scheduledLabel,
        totalCents: order.totalCents,
        fulfillmentType: order.fulfillmentType,
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        isRush,
      });
      return NextResponse.json({ url: `/order/success?order=${orderNumber}&submitted=custom` });
    }

    await sendRushRequestReceived({
      to: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      scheduledDate: scheduledLabel,
      trackingToken: order.trackingToken,
    });
    await sendRushRequestToAdmin({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      preferredContactMethod: order.preferredContactMethod,
      scheduledDate: scheduledLabel,
      totalCents: order.totalCents,
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
    });

    return NextResponse.json({ url: `/order/success?order=${orderNumber}&submitted=rush` });
  }

  const policy = getPaymentPolicy(items as CartItem[], totalCents, {
    depositPercent: settings.depositPercent,
    fullPaymentThresholdCents: settings.fullPaymentThresholdCents,
  });

  const payment = resolveCheckoutPayment(
    policy.payInFullOnly ? "full" : paymentChoice,
    policy
  );

  const status = payment.paidInFull ? "CONFIRMED" : "PENDING_DEPOSIT";

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status,
      isRush: false,
      customerName: meta.customerName,
      customerEmail: meta.customerEmail,
      customerPhone: meta.customerPhone,
      preferredContactMethod: normalizePreferredContact(
        meta.customerPhone,
        meta.preferredContactMethod
      ),
      fulfillmentType: meta.fulfillmentType,
      deliveryAddress: meta.deliveryAddress,
      scheduledDate: new Date(meta.scheduledDate),
      subtotalCents: subtotal,
      deliveryFeeCents,
      totalCents,
      depositCents: payment.depositCents,
      balanceDueCents: payment.balanceDueCents,
      paidInFull: payment.paidInFull,
      items: {
        create: (items as CartItem[]).map((item) => mapCartItemToOrderItem(item)),
      },
    },
    include: { items: true },
  });

  const chargeLabel = payment.paidInFull ? "Payment" : "Deposit";

  if (!square) {
    const paid = await prisma.order.update({
      where: { id: order.id },
      data: {
        depositPaid: true,
        status: "CONFIRMED",
      },
      include: { items: true },
    });
    await sendOrderConfirmationFromOrder(paid);
    await sendAdminNewOrder({
      orderNumber: paid.orderNumber,
      customerName: paid.customerName,
      customerEmail: paid.customerEmail,
      customerPhone: paid.customerPhone,
      preferredContactMethod: paid.preferredContactMethod,
      totalCents: paid.totalCents,
      scheduledDate: format(paid.scheduledDate, "EEEE, MMMM d, yyyy"),
      fulfillmentType: paid.fulfillmentType,
      deliveryAddress: paid.deliveryAddress,
      items: paid.items,
      pendingReview: false,
    });
    return NextResponse.json({ url: `/order/success?order=${orderNumber}&demo=1` });
  }

  const siteUrl = await getSiteUrl();
  const { url, paymentLinkId } = await createSquarePaymentLink({
    name: `${chargeLabel} for order ${orderNumber}`,
    chargeCents: payment.chargeCents,
    redirectUrl: `${siteUrl}/order/success?order=${orderNumber}`,
    buyerEmail: meta.customerEmail,
    metadata: {
      orderId: order.id,
      orderNumber,
      paymentType: "deposit",
      paidInFull: payment.paidInFull,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { squarePaymentLinkId: paymentLinkId },
  });

  return NextResponse.json({ url });
}
