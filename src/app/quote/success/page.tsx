import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function QuoteSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const quote = token
    ? await prisma.quoteRequest.findUnique({ where: { paymentToken: token } })
    : null;

  const order = quote?.convertedOrderId
    ? await prisma.order.findUnique({ where: { id: quote.convertedOrderId } })
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--sage)]">Quote approved!</h1>
      <p className="mt-4 text-[var(--warm-gray)]">
        Your payment has been received. Brandy will be in touch with next steps.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        {token && (
          <Link href={`/quote/status/${token}`} className="btn-secondary inline-flex">
            View quote status
          </Link>
        )}
        {order && (
          <Link href={`/order/status/${order.trackingToken}`} className="btn-primary inline-flex">
            Track order {order.orderNumber}
          </Link>
        )}
        <Link href="/" className="text-sm text-[var(--rose)] hover:underline">Back to home</Link>
      </div>
    </div>
  );
}
