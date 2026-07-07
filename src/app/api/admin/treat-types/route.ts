import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
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
  const items = await prisma.treatTypeOption.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const data = z.object({
    name: z.string().min(1),
    sortOrder: z.number().int().optional(),
  }).merge(scopeFields).parse(await req.json());
  const scope = parseScope(data);
  const item = await prisma.treatTypeOption.create({
    data: { name: data.name, sortOrder: data.sortOrder, ...scope },
  });
  return NextResponse.json(item);
}
