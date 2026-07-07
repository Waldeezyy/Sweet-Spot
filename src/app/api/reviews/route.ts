import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  author: z.string().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(2000),
  itemName: z.string().max(120).optional(),
  photos: z.array(z.string().min(1)).max(3).optional(),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Please check your review and try again." }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      author: body.data.author.trim(),
      rating: body.data.rating,
      text: body.data.text.trim(),
      itemName: body.data.itemName?.trim() || null,
      photos: body.data.photos ?? [],
    },
  });

  return NextResponse.json({ id: review.id });
}
