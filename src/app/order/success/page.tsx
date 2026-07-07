import Link from "next/link";
import { CartClearer } from "@/components/order/CartClearer";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; demo?: string }>;
}) {
  const { order: orderNumber, demo } = await searchParams;
  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber } })
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <CartClearer />
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--sage)]">Thank You!</h1>
      {orderNumber && <p className="mt-4 text-lg">Order <strong>{orderNumber}</strong> received.</p>}
      <p className="mt-4 text-[var(--warm-gray)]">
        {demo
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
      <Link href="/" className="btn-primary mt-8 inline-flex">Back to Home</Link>
    </div>
  );
}
