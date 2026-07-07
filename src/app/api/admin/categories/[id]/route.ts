import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/slugify";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const { id } = await params;
  const data = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    formType: z.enum(["SIMPLE", "CUPCAKE", "ROUND_CAKE", "SHEET_CAKE", "PARTY_PACKAGE"]).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }).parse(await req.json());

  const update: Record<string, unknown> = { ...data };
  if (data.name && !data.slug) update.slug = slugify(data.name);

  const category = await prisma.category.update({ where: { id }, data: update });
  return NextResponse.json(category);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const { id } = await params;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.category.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
