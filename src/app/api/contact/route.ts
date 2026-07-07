import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactForm } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await sendContactForm(body.data);
  return NextResponse.json({ ok: true });
}
