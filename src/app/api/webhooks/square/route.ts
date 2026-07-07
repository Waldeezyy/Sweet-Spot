import { NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { parsePaymentNote } from "@/lib/square-payment-link";
import { fulfillSquarePayment } from "@/lib/fulfill-square-payment";

type SquareWebhookEvent = {
  type?: string;
  data?: {
    type?: string;
    object?: {
      payment?: {
        id?: string;
        status?: string;
        note?: string;
        amountMoney?: { amount?: bigint | number };
        totalMoney?: { amount?: bigint | number };
      };
    };
  };
};

function moneyToCents(amount?: bigint | number): number {
  if (amount == null) return 0;
  return Number(amount);
}

export async function POST(req: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;
  if (!signatureKey || !notificationUrl) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const isValid = WebhooksHelper.verifySignature({
    requestBody: body,
    signatureHeader: signature,
    signatureKey,
    notificationUrl,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: SquareWebhookEvent;
  try {
    event = JSON.parse(body) as SquareWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "payment.updated" && event.type !== "payment.created") {
    return NextResponse.json({ received: true });
  }

  const payment = event.data?.object?.payment;
  if (!payment || payment.status !== "COMPLETED") {
    return NextResponse.json({ received: true });
  }

  const meta = parsePaymentNote(payment.note);
  if (!meta) {
    return NextResponse.json({ received: true });
  }

  const amountPaidCents = moneyToCents(payment.totalMoney?.amount ?? payment.amountMoney?.amount);

  try {
    await fulfillSquarePayment(meta, amountPaidCents, payment.id);
  } catch (error) {
    console.error("[square webhook] fulfillment failed", error);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
