import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const addOns = await prisma.addOnOption.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(addOns);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const data = z.object({
    name: z.string().min(1),
    slug: z.string().optional(),
    priceCents: z.number().int().positive(),
    priceLabel: z.string().min(1),
    sortOrder: z.number().int().optional(),
  }).parse(await req.json());
  const slug = data.slug ?? slugify(data.name);
  const addOn = await prisma.addOnOption.create({
    data: { ...data, slug },
  });
  return NextResponse.json(addOn);
}
