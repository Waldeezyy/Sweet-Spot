import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  basePriceCents: z.number().int().positive().optional(),
  isStartingPrice: z.boolean().optional(),
  orderType: z.enum(["STANDARD", "SEMI_CUSTOM"]).optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const product = await prisma.product.update({ where: { id }, data: parsed.data });
  return NextResponse.json(product);
}
