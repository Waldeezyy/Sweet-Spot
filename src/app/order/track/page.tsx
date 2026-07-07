import { TrackOrderForm } from "@/components/order/TrackOrderForm";

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">Track Your Order</h1>
      <p className="mt-2 text-[var(--warm-gray)]">
        Enter your order number and email to see the latest status.
      </p>
      <TrackOrderForm />
    </div>
  );
}
