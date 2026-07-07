import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { url } = z.object({ url: z.string().url() }).parse(await req.json());
  const maxSort = await prisma.galleryImage.aggregate({ _max: { sortOrder: true } });
  const image = await prisma.galleryImage.create({
    data: { url, sortOrder: (maxSort._max.sortOrder ?? 0) + 1 },
  });
  return NextResponse.json(image);
}
