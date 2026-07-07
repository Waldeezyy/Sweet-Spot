import Link from "next/link";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; demo?: string }>;
}) {
  const { order, demo } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--sage)]">Thank You!</h1>
      {order && <p className="mt-4 text-lg">Order <strong>{order}</strong> received.</p>}
      <p className="mt-4 text-[var(--warm-gray)]">
        {demo
          ? "Demo mode — Stripe is not configured. In production, your deposit would be processed."
          : "Your deposit has been received. Check your email for confirmation."}
      </p>
      <Link href="/" className="btn-primary mt-8 inline-flex">Back to Home</Link>
    </div>
  );
}
