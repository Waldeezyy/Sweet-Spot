import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET() {
  const rows = await prisma.availability.findMany();
  const mapped = rows.map((r) => ({
    date: format(r.date, "yyyy-MM-dd"),
    isBlocked: r.isBlocked,
    maxOrders: r.maxOrders,
  }));
  return NextResponse.json(mapped);
}
