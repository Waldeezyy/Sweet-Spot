import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { orderNumber, email } = z
    .object({ orderNumber: z.string().min(1), email: z.string().email() })
    .parse(await req.json());

  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim() },
  });

  if (!order || order.customerEmail.toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "No order found with that number and email." },
      { status: 404 }
    );
  }

  return NextResponse.json({ trackingToken: order.trackingToken });
}
