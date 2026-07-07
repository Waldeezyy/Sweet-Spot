import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";

export async function GET() {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const flavors = await prisma.flavorOption.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(flavors);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const data = z.object({
    name: z.string().min(1),
    flavorGroup: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
  }).parse(await req.json());
  const flavor = await prisma.flavorOption.create({ data });
  return NextResponse.json(flavor);
}
