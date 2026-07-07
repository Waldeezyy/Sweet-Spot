import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { sendOrderStatusUpdate } from "@/lib/email";

const NOTIFY_STATUSES = ["CONFIRMED", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const data = z.object({
    status: z.enum(["PENDING_DEPOSIT", "PENDING_REVIEW", "CONFIRMED", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"]).optional(),
    finalTotalCents: z.number().int().optional(),
    adminNotes: z.string().optional(),
    estimatedReadyAt: z.string().datetime().optional(),
  }).parse(await req.json());

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: data.status,
      finalTotalCents: data.finalTotalCents,
      adminNotes: data.adminNotes,
      estimatedReadyAt: data.estimatedReadyAt ? new Date(data.estimatedReadyAt) : undefined,
      balanceDueCents: data.finalTotalCents
        ? Math.max(0, data.finalTotalCents - existing.depositCents)
        : undefined,
    },
    include: { items: true },
  });

  const statusChanged = data.status && data.status !== existing.status;
  const priceConfirmed = data.finalTotalCents != null && existing.status === "PENDING_REVIEW" && data.status === "CONFIRMED";

  if (statusChanged && data.status && NOTIFY_STATUSES.includes(data.status as typeof NOTIFY_STATUSES[number])) {
    const settings = await prisma.shopSettings.findFirst();
    await sendOrderStatusUpdate({
      to: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      status: data.status,
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
