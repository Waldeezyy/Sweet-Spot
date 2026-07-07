import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendQuoteRequestToAdmin } from "@/lib/email";
import { format } from "date-fns";

const schema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  occasion: z.string().min(1),
  scheduledDate: z.string(),
  servings: z.number().nullable().optional(),
  description: z.string().min(1),
  dietaryNotes: z.string().optional(),
  budgetRange: z.string().optional(),
  inspirationPhotos: z.array(z.string()).optional(),
});

export async function GET() {
  const quotes = await prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(quotes);
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;
  const quote = await prisma.quoteRequest.create({
    data: {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      occasion: data.occasion,
      scheduledDate: new Date(data.scheduledDate),
      servings: data.servings,
      description: data.description,
      dietaryNotes: data.dietaryNotes,
      budgetRange: data.budgetRange,
      inspirationPhotos: data.inspirationPhotos ?? [],
    },
  });

  await sendQuoteRequestToAdmin({
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    occasion: data.occasion,
    scheduledDate: format(new Date(data.scheduledDate), "MMM d, yyyy"),
    description: data.description,
    servings: data.servings,
    budgetRange: data.budgetRange,
  });

  return NextResponse.json(quote);
}
