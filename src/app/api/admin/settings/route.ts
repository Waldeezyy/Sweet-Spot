import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";

const schema = z.object({
  businessName: z.string().optional(),
  tagline: z.string().nullable().optional(),
  aboutText: z.string().optional(),
  contactEmail: z.string().email().optional(),
  location: z.string().optional(),
  orderMinimumCents: z.number().int().optional(),
  depositPercent: z.number().int().optional(),
  leadTimeDays: z.number().int().optional(),
  deliveryRadiusMiles: z.number().int().optional(),
  deliveryFeeCents: z.number().int().optional(),
  pickupInstructions: z.string().optional(),
  deliveryNote: z.string().optional(),
  allergyNote: z.string().optional(),
});

export async function PATCH(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const data = schema.parse(await req.json());
  const settings = await prisma.shopSettings.update({ where: { id: 1 }, data });
  return NextResponse.json(settings);
}
