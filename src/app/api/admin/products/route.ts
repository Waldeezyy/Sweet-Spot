import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1),
  description: z.string(),
  basePriceCents: z.number().int().positive(),
  isStartingPrice: z.boolean().optional(),
  orderType: z.enum(["STANDARD", "SEMI_CUSTOM"]).optional(),
  categoryId: z.string(),
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const slug = slugify(parsed.data.name);
  const product = await prisma.product.create({
    data: { ...parsed.data, slug: `${slug}-${Date.now()}` },
  });
  return NextResponse.json(product);
}
