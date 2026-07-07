import { randomUUID } from "crypto";
import { square, getSquareLocationId } from "@/lib/square";

export type PaymentLinkMetadata = {
  orderId?: string;
  quoteId?: string;
  orderNumber?: string;
  paymentType: "deposit" | "balance";
  paidInFull: boolean;
};

const NOTE_PREFIX = "bss:";

export function encodePaymentNote(meta: PaymentLinkMetadata): string {
  const parts = [`pt=${meta.paymentType}`, `pf=${meta.paidInFull ? "1" : "0"}`];
  if (meta.orderId) parts.push(`oid=${meta.orderId}`);
  if (meta.quoteId) parts.push(`qid=${meta.quoteId}`);
  if (meta.orderNumber) parts.push(`on=${meta.orderNumber}`);
  return `${NOTE_PREFIX}${parts.join("|")}`;
}

export function parsePaymentNote(note?: string | null): PaymentLinkMetadata | null {
  if (!note?.startsWith(NOTE_PREFIX)) return null;
  const body = note.slice(NOTE_PREFIX.length);
  const fields = Object.fromEntries(
    body.split("|").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key, rest.join("=")];
    })
  );

  const paymentType = fields.pt === "balance" ? "balance" : "deposit";
  const paidInFull = fields.pf === "1";

  if (!fields.oid && !fields.qid) return null;

  return {
    orderId: fields.oid,
    quoteId: fields.qid,
    orderNumber: fields.on,
    paymentType,
    paidInFull,
  };
}

export async function createSquarePaymentLink(params: {
  name: string;
  chargeCents: number;
  redirectUrl: string;
  metadata: PaymentLinkMetadata;
  buyerEmail?: string;
}): Promise<{ url: string; paymentLinkId: string }> {
  if (!square) {
    throw new Error("Square is not configured");
  }

  const response = await square.checkout.paymentLinks.create({
    idempotencyKey: randomUUID(),
    description: params.name,
    paymentNote: encodePaymentNote(params.metadata),
    quickPay: {
      name: params.name,
      priceMoney: {
        amount: BigInt(params.chargeCents),
        currency: "USD",
      },
      locationId: getSquareLocationId(),
    },
    checkoutOptions: {
      redirectUrl: params.redirectUrl,
      merchantSupportEmail: process.env.ADMIN_EMAIL ?? undefined,
    },
    prePopulatedData: params.buyerEmail ? { buyerEmail: params.buyerEmail } : undefined,
  });

  const paymentLink = response.paymentLink;
  const url = paymentLink?.url ?? paymentLink?.longUrl;
  if (!url || !paymentLink?.id) {
    throw new Error("Square did not return a payment link URL");
  }

  return { url, paymentLinkId: paymentLink.id };
}
