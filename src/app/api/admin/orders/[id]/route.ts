import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { sendOrderStatusUpdate } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const data = z.object({
    status: z.enum(["PENDING_DEPOSIT", "PENDING_REVIEW", "CONFIRMED", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"]).optional(),
    finalTotalCents: z.number().int().optional(),
    adminNotes: z.string().optional(),
  }).parse(await req.json());

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: data.status,
      finalTotalCents: data.finalTotalCents,
      adminNotes: data.adminNotes,
      balanceDueCents: data.finalTotalCents
        ? data.finalTotalCents - (await prisma.order.findUnique({ where: { id } }))!.depositCents
        : undefined,
    },
  });

  if (data.status === "READY") {
    await sendOrderStatusUpdate({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      status: "READY",
    });
  }

  return NextResponse.json(order);
}
