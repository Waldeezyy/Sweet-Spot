import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { priceTiersSchema } from "@/lib/product-price-tiers";

const schema = z.object({
  name: z.string().min(1),
  description: z.string(),
  basePriceCents: z.number().int().positive(),
  isStartingPrice: z.boolean().optional(),
  orderType: z.enum(["STANDARD", "SEMI_CUSTOM"]).optional(),
  categoryId: z.string(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  allowFlavor: z.boolean().optional(),
  allowTopping: z.boolean().optional(),
  allowFrosting: z.boolean().optional(),
  allowWriting: z.boolean().optional(),
  maxFlavorOptions: z.number().int().min(1).max(6).optional(),
  piecesPerOrderUnit: z.number().int().min(1).optional(),
  priceTiers: priceTiersSchema.optional(),
});

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const slug = slugify(parsed.data.name);
  const { sortOrder: _sortOrder, priceTiers, ...rest } = parsed.data;
  const maxSort = await prisma.product.aggregate({
    where: { categoryId: parsed.data.categoryId },
    _max: { sortOrder: true },
  });
  const product = await prisma.product.create({
    data: {
      ...rest,
      slug: `${slug}-${Date.now()}`,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      ...(priceTiers && { priceTiers }),
    },
  });
  return NextResponse.json(product);
}
