import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactForm } from "@/lib/email";
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
    name: z.string().min(1),
    email: z.string().email(),
    phone: optionalText,
    preferredContactMethod: preferredContactMethodSchema.optional(),
    message: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (hasMultipleContactMethods(data.phone) && !data.preferredContactMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preferred contact method is required when a phone number is provided.",
        path: ["preferredContactMethod"],
      });
    }
  });

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await sendContactForm({
    name: body.data.name,
    email: body.data.email,
    phone: body.data.phone,
    preferredContactMethod: normalizePreferredContact(body.data.phone, body.data.preferredContactMethod),
    message: body.data.message,
  });
  return NextResponse.json({ ok: true });
}
