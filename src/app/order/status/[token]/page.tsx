import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { getTimelineStep, STATUS_LABELS } from "@/lib/order-tracking";
import { formatOrderItemLine } from "@/lib/order-item-display";
import { PayBalanceButton } from "@/components/order/PayBalanceButton";
import { BalancePaidNotice } from "@/components/order/BalancePaidNotice";
import { stripe } from "@/lib/stripe";

const TIMELINE = [
  { step: 1, label: "Confirmed" },
  { step: 2, label: "In progress" },
  { step: 3, label: "Ready" },
  { step: 4, label: "Completed" },
];

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: { items: true },
  });
  if (!order) notFound();

  const currentStep = getTimelineStep(order.status);
  const isCancelled = order.status === "CANCELLED";
  const awaitingPayment = order.status === "PENDING_DEPOSIT" || order.status === "PENDING_REVIEW";
  const showBalancePay =
    order.depositPaid && !order.paidInFull && order.balanceDueCents > 0 && order.status !== "CANCELLED";

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Order {order.orderNumber}</h1>
      <p className="mt-2 text-[var(--warm-gray)]">
        Scheduled for {format(order.scheduledDate, "EEEE, MMMM d, yyyy")}
        {" · "}
        {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
      </p>

      {isCancelled ? (
        <div className="card mt-8 border-red-200 bg-red-50">
          <p className="font-semibold text-red-800">This order was cancelled.</p>
        </div>
      ) : awaitingPayment ? (
        <div className="card mt-8">
          <p className="font-semibold">{STATUS_LABELS[order.status]}</p>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">
            {order.status === "PENDING_REVIEW"
              ? "Brandy is confirming your final price. You'll receive an update soon."
              : "We're waiting for your deposit to confirm this order."}
          </p>
        </div>
      ) : (
        <div className="card mt-8">
          <p className="mb-6 font-semibold text-[var(--sage)]">{STATUS_LABELS[order.status]}</p>
          <ol className="space-y-4">
            {TIMELINE.map(({ step, label }) => {
              const done = currentStep >= step;
              const active = currentStep === step;
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      done ? "bg-[var(--sage)] text-white" : "bg-[var(--blush)] text-[var(--warm-gray)]"
                    } ${active ? "ring-2 ring-[var(--sage)] ring-offset-2" : ""}`}
                  >
                    {step}
                  </span>
                  <span className={done ? "font-medium" : "text-[var(--warm-gray)]"}>{label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <Suspense fallback={null}>
        <BalancePaidNotice />
      </Suspense>

      <div className="card mt-6 space-y-2 text-sm">
        <h2 className="font-semibold">Your items</h2>
        <ul className="space-y-1 text-[var(--warm-gray)]">
          {order.items.map((item) => (
            <li key={item.id}>{formatOrderItemLine(item)}</li>
          ))}
        </ul>
        <p className="pt-2 font-semibold">
          Total: {formatCents(order.finalTotalCents ?? order.totalCents)}
        </p>
        {!order.paidInFull && order.balanceDueCents > 0 && (
          <p className="text-[var(--warm-gray)]">Balance due: {formatCents(order.balanceDueCents)}</p>
        )}
        {showBalancePay && (
          <PayBalanceButton
            token={token}
            balanceDueCents={order.balanceDueCents}
            stripeEnabled={Boolean(stripe)}
          />
        )}
        {order.status === "IN_PROGRESS" && order.estimatedReadyAt && (
          <p className="text-[var(--warm-gray)]">
            Estimated ready: {format(order.estimatedReadyAt, "EEEE, MMMM d 'at' h:mm a")}
          </p>
        )}
      </div>

      <Link href="/" className="btn-secondary mt-8 inline-flex">Back to home</Link>
    </div>
  );
}
