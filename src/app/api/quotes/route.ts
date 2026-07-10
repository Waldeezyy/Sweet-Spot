import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendQuoteRequestToAdmin } from "@/lib/email";
import { format } from "date-fns";
import {
  hasMultipleContactMethods,
  normalizePreferredContact,
  preferredContactMethodSchema,
} from "@/lib/preferred-contact";

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const schema = z
  .object({
    customerName: z.string().trim().min(1),
    customerEmail: z.string().trim().email(),
    customerPhone: optionalText,
    preferredContactMethod: preferredContactMethodSchema.optional(),
    occasion: z.string().trim().min(1),
    scheduledDate: z.string().min(1),
    servings: z.number().int().positive().nullable().optional(),
    description: z.string().trim().min(1),
    dietaryNotes: optionalText,
    budgetRange: optionalText,
    inspirationPhotos: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (hasMultipleContactMethods(data.customerPhone) && !data.preferredContactMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preferred contact method is required when a phone number is provided.",
        path: ["preferredContactMethod"],
      });
    }
  });

export async function GET() {
  const quotes = await prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(quotes);
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    console.error("[quotes] validation failed", parsed.error.flatten());
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;
  const preferredContactMethod = normalizePreferredContact(
    data.customerPhone,
    data.preferredContactMethod
  );

  try {
    const quote = await prisma.quoteRequest.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        preferredContactMethod,
        occasion: data.occasion,
        scheduledDate: new Date(data.scheduledDate),
        servings: data.servings,
        description: data.description,
        dietaryNotes: data.dietaryNotes,
        budgetRange: data.budgetRange,
        inspirationPhotos: data.inspirationPhotos ?? [],
      },
    });

    try {
      await sendQuoteRequestToAdmin({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        preferredContactMethod,
        occasion: data.occasion,
        scheduledDate: format(new Date(data.scheduledDate), "MMM d, yyyy"),
        description: data.description,
        servings: data.servings,
        budgetRange: data.budgetRange,
      });
    } catch (emailError) {
      console.error("[quotes] admin notification email failed", emailError);
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("[quotes] create failed", error);
    return NextResponse.json({ error: "Could not save request" }, { status: 500 });
  }
}
