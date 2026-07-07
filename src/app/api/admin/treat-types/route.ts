import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";

export async function GET() {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const items = await prisma.treatTypeOption.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const data = z.object({
    name: z.string().min(1),
    sortOrder: z.number().int().optional(),
  }).parse(await req.json());
  const item = await prisma.treatTypeOption.create({ data });
  return NextResponse.json(item);
}
