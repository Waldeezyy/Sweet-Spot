import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.shopSettings.findFirst();
  return NextResponse.json(settings);
}
