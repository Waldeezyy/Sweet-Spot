import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const data = z.object({
    name: z.string().min(1),
    slug: z.string().optional(),
    formType: z.enum(["SIMPLE", "CUPCAKE", "ROUND_CAKE", "SHEET_CAKE", "PARTY_PACKAGE"]).optional(),
    sortOrder: z.number().int().optional(),
  }).parse(await req.json());
  const slug = data.slug ?? slugify(data.name);
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      formType: data.formType ?? "SIMPLE",
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return NextResponse.json(category);
}
