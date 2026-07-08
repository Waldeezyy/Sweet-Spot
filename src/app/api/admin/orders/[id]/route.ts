import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import {
  sendOrderStatusUpdate,
  sendOrderConfirmationFromOrder,
  sendRushApproved,
  sendRushDeclined,
  sendOrderQuoted,
  sendOrderQuoteDeclined,
} from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { RUSH_FEE_CENTS } from "@/lib/rush-order";
import { orderHasSemiCustomItems } from "@/lib/order-semi-custom";

const NOTIFY_STATUSES = ["CONFIRMED", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = z
    .object({
      action: z.enum(["approve_rush", "decline_rush", "approve_quote", "decline_quote", "mark_paid_offline"]).optional(),
      status: z
        .enum(["PENDING_DEPOSIT", "PENDING_REVIEW", "CONFIRMED", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"])
        .optional(),
      finalTotalCents: z.number().int().optional(),
      adminNotes: z.string().optional(),
      estimatedReadyAt: z.string().datetime().optional(),
      declineMessage: z.string().optional(),
      approvalMessage: z.string().optional(),
      paidInFull: z.boolean().optional(),
      offlineNote: z.string().optional(),
    })
    .parse(await req.json());

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const semiCustom = await orderHasSemiCustomItems(existing.items);

  if (body.action === "decline_rush") {
    if (!existing.isRush || semiCustom || existing.status !== "PENDING_REVIEW") {
      return NextResponse.json({ error: "Not a pending rush request" }, { status: 400 });
    }
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        adminNotes: body.declineMessage ?? existing.adminNotes,
      },
      include: { items: true },
    });
    await sendRushDeclined({
      to: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      message: body.declineMessage,
    });
    return NextResponse.json(order);
  }

  if (body.action === "decline_quote") {
    if (!semiCustom || existing.status !== "PENDING_REVIEW" || existing.depositPaid) {
      return NextResponse.json({ error: "Not a pending custom order request" }, { status: 400 });
    }
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        adminNotes: body.declineMessage ?? existing.adminNotes,
      },
      include: { items: true },
    });
    await sendOrderQuoteDeclined({
      to: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      message: body.declineMessage,
    });
    return NextResponse.json(order);
  }

  if (body.action === "approve_rush") {
    if (!existing.isRush || semiCustom || existing.status !== "PENDING_REVIEW" || existing.depositPaid) {
      return NextResponse.json({ error: "Not a pending rush request" }, { status: 400 });
    }
    const finalTotalCents = existing.totalCents + RUSH_FEE_CENTS;
    const token = randomUUID();
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "PENDING_DEPOSIT",
        finalTotalCents,
        paymentToken: token,
        balanceDueCents: finalTotalCents,
        adminNotes: body.approvalMessage ?? existing.adminNotes,
      },
      include: { items: true },
    });

    const siteUrl = await getSiteUrl();
    const paymentUrl = `${siteUrl}/order/pay/${token}`;
    await sendRushApproved({
      to: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      finalTotalCents,
      rushFeeCents: RUSH_FEE_CENTS,
      baseTotalCents: existing.totalCents,
      paymentUrl,
      message: body.approvalMessage,
    });

    return NextResponse.json({ ...order, paymentUrl });
  }

  if (body.action === "approve_quote") {
    if (!semiCustom || existing.status !== "PENDING_REVIEW" || existing.depositPaid) {
      return NextResponse.json({ error: "Not a pending custom order request" }, { status: 400 });
    }
    if (body.finalTotalCents == null || body.finalTotalCents < 0) {
      return NextResponse.json({ error: "Quoted price is required" }, { status: 400 });
    }
    const token = randomUUID();
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "PENDING_DEPOSIT",
        finalTotalCents: body.finalTotalCents,
        paymentToken: token,
        balanceDueCents: body.finalTotalCents,
        adminNotes: body.approvalMessage ?? existing.adminNotes,
      },
      include: { items: true },
    });

    const siteUrl = await getSiteUrl();
    const paymentUrl = `${siteUrl}/order/pay/${token}`;
    const trackUrl = `${siteUrl}/order/status/${order.trackingToken}`;
    await sendOrderQuoted({
      to: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      finalTotalCents: body.finalTotalCents,
      estimatedTotalCents: existing.totalCents,
      paymentUrl,
      trackUrl,
      scheduledDate: format(order.scheduledDate, "EEEE, MMMM d, yyyy"),
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      message: body.approvalMessage,
    });

    return NextResponse.json({ ...order, paymentUrl });
  }

  if (body.action === "mark_paid_offline") {
    if (!existing.paymentToken || existing.depositPaid) {
      return NextResponse.json({ error: "Order not awaiting payment" }, { status: 400 });
    }
    const finalTotal = existing.finalTotalCents ?? existing.totalCents;
    const settings = await prisma.shopSettings.findFirst();
    const depositPercent = settings?.depositPercent ?? 25;
    const paidInFull = body.paidInFull ?? false;
    const depositCents = paidInFull ? finalTotal : Math.round(finalTotal * (depositPercent / 100));
    const balanceDueCents = finalTotal - depositCents;
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        depositPaid: true,
        paidInFull,
        depositCents,
        balanceDueCents,
        finalTotalCents: finalTotal,
        adminNotes: [
          existing.adminNotes,
          body.offlineNote ? `Paid offline: ${body.offlineNote}` : "Paid offline",
        ]
          .filter(Boolean)
          .join("\n"),
      },
      include: { items: true },
    });
    await sendOrderConfirmationFromOrder(order);
    return NextResponse.json(order);
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: body.status,
      finalTotalCents: body.finalTotalCents,
      adminNotes: body.adminNotes,
      estimatedReadyAt: body.estimatedReadyAt ? new Date(body.estimatedReadyAt) : undefined,
      balanceDueCents: body.finalTotalCents
        ? Math.max(0, body.finalTotalCents - existing.depositCents)
        : undefined,
    },
    include: { items: true },
  });

  const statusChanged = body.status && body.status !== existing.status;
  const priceConfirmed =
    body.finalTotalCents != null && existing.status === "PENDING_REVIEW" && body.status === "CONFIRMED";

  if (statusChanged && body.status && NOTIFY_STATUSES.includes(body.status as (typeof NOTIFY_STATUSES)[number])) {
    const settings = await prisma.shopSettings.findFirst();
    await sendOrderStatusUpdate({
      to: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      status: body.status,
      scheduledDate: format(order.scheduledDate, "EEEE, MMMM d, yyyy"),
      fulfillmentType: order.fulfillmentType,
      trackingToken: order.trackingToken,
      items: order.items,
      totalCents: order.totalCents,
      depositCents: order.depositCents,
      balanceDueCents: order.balanceDueCents,
      paidInFull: order.paidInFull,
      deliveryAddress: order.deliveryAddress,
      pickupInstructions: settings?.pickupInstructions,
      finalTotalCents: priceConfirmed ? order.finalTotalCents : undefined,
      estimatedReadyAt: order.estimatedReadyAt,
    });
  }

  return NextResponse.json(order);
}
