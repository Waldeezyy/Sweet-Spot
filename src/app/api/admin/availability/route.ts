import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { date, isBlocked, maxOrders } = z.object({
    date: z.string(),
    isBlocked: z.boolean(),
    maxOrders: z.number().optional(),
  }).parse(await req.json());

  const avail = await prisma.availability.upsert({
    where: { date: new Date(date) },
    create: { date: new Date(date), isBlocked, maxOrders: maxOrders ?? 10 },
    update: { isBlocked, maxOrders },
  });

  return NextResponse.json(avail);
}
