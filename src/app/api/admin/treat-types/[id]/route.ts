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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const { id } = await params;
  const data = z.object({
    name: z.string().min(1).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }).merge(scopeFields).parse(await req.json());
  const { categorySlugs, productSlugs, ...rest } = data;
  const scope =
    categorySlugs !== undefined || productSlugs !== undefined
      ? parseScope({ categorySlugs, productSlugs })
      : {};
  const item = await prisma.treatTypeOption.update({
    where: { id },
    data: { ...rest, ...scope },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const { id } = await params;
  await prisma.treatTypeOption.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
