import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/slugify";
import { normalizeScope } from "@/lib/menu-option-scope";

const scopeFields = z.object({
  categorySlugs: z.array(z.string()).optional(),
  productSlugs: z.array(z.string()).optional(),
});

function parseScope(data: { categorySlugs?: string[]; productSlugs?: string[] }) {
  return normalizeScope({
    categorySlugs: data.categorySlugs ?? [],
    productSlugs: data.productSlugs ?? [],
  });
}

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
  }).merge(scopeFields).parse(await req.json());
  const slug = data.slug ?? slugify(data.name);
  const scope = parseScope(data);
  const addOn = await prisma.addOnOption.create({
    data: { name: data.name, priceCents: data.priceCents, priceLabel: data.priceLabel, sortOrder: data.sortOrder, slug, ...scope },
  });
  return NextResponse.json(addOn);
}
