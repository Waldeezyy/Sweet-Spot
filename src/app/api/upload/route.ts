import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getMaxUploadInputBytes, getUploadDir, processUploadImage } from "@/lib/process-upload-image";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > getMaxUploadInputBytes()) {
    return NextResponse.json({ error: "Image is too large. Try a photo under 12 MB." }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await processUploadImage(Buffer.from(bytes));
  } catch {
    return NextResponse.json({ error: "Could not process image. Try a different file." }, { status: 400 });
  }

  const filename = `${randomUUID()}.webp`;
  const uploadDir = getUploadDir();

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const url = `${baseUrl}/uploads/${filename}`;
  return NextResponse.json({ url });
}
