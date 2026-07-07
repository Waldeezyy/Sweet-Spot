import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { OrderPayForm } from "@/components/order/OrderPayForm";
import { stripe } from "@/lib/stripe";

export default async function OrderPayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await prisma.order.findUnique({ where: { paymentToken: token } });
  if (!order || !order.finalTotalCents) notFound();

  if (order.depositPaid || order.status === "CONFIRMED" || order.status === "IN_PROGRESS" || order.status === "READY" || order.status === "COMPLETED") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--sage)]">Order confirmed</h1>
        <p className="mt-4 text-[var(--warm-gray)]">This order has already been paid. Thank you!</p>
        <Link href={`/order/status/${order.trackingToken}`} className="btn-primary mt-8 inline-flex">
          Track your order
        </Link>
      </div>
    );
  }

  if (order.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Order unavailable</h1>
        <p className="mt-4 text-[var(--warm-gray)]">This rush request is no longer active.</p>
        <Link href="/order" className="btn-secondary mt-8 inline-flex">Place a new order</Link>
      </div>
    );
  }

  const settings = await prisma.shopSettings.findFirst();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Pay for Your Rush Order</h1>
      <p className="mt-2 text-sm text-[var(--warm-gray)]">
        {format(order.scheduledDate, "MMMM d, yyyy")} · {order.orderNumber}
      </p>
      <OrderPayForm
        token={token}
        customerName={order.customerName}
        orderNumber={order.orderNumber}
        baseTotalCents={order.totalCents}
        finalTotalCents={order.finalTotalCents}
        depositPercent={settings?.depositPercent ?? 25}
        stripeEnabled={Boolean(stripe)}
      />
      <Link href={`/order/status/${order.trackingToken}`} className="mt-4 block text-center text-sm text-[var(--rose)] hover:underline">
        Track your order
      </Link>
    </div>
  );
}
