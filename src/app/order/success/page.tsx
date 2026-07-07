import Link from "next/link";
import { CartClearer } from "@/components/order/CartClearer";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; demo?: string; submitted?: string }>;
}) {
  const { order: orderNumber, demo, submitted } = await searchParams;
  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber } })
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <CartClearer />
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--sage)]">Thank You!</h1>
      {orderNumber && <p className="mt-4 text-lg">Order <strong>{orderNumber}</strong> received.</p>}
      <p className="mt-4 text-[var(--warm-gray)]">
        {submitted
          ? "Your rush order request has been submitted. Brandy will review your date and email you if approved — you will not be charged unless your request is accepted."
          : demo
            ? "Demo mode — Stripe is not configured yet, so no payment was charged. Your order was still saved."
            : order?.paidInFull
              ? "Your payment has been received in full. Check your email for confirmation."
              : "Your deposit has been received. Check your email for confirmation."}
      </p>
      {order && !order.paidInFull && order.balanceDueCents > 0 && (
        <p className="mt-2 text-sm text-[var(--warm-gray)]">
          Balance due at pickup/delivery: {formatCents(order.balanceDueCents)}
        </p>
      )}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {order?.trackingToken && (
          <Link href={`/order/status/${order.trackingToken}`} className="btn-primary inline-flex">
            Track your order
          </Link>
        )}
        <Link href="/order/track" className="btn-secondary inline-flex">
          Look up later
        </Link>
        <Link href="/" className="text-sm text-[var(--rose)] hover:underline">Back to home</Link>
      </div>
    </div>
  );
}
