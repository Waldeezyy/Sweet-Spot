import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const { id } = await params;
  const data = z.object({
    name: z.string().min(1).optional(),
    flavorGroup: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }).parse(await req.json());
  const flavor = await prisma.flavorOption.update({ where: { id }, data });
  return NextResponse.json(flavor);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;
  const { id } = await params;
  await prisma.flavorOption.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
