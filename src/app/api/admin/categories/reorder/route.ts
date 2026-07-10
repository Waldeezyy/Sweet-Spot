import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-api";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { orderedIds } = schema.parse(await req.json());
  const existing = await prisma.category.findMany({ select: { id: true } });
  if (orderedIds.length !== existing.length) {
    return NextResponse.json({ error: "Invalid category order" }, { status: 400 });
  }
  const existingIds = new Set(existing.map((c) => c.id));
  if (!orderedIds.every((id) => existingIds.has(id))) {
    return NextResponse.json({ error: "Invalid category order" }, { status: 400 });
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
