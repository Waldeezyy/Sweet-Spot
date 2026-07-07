"use client";

import { useSearchParams } from "next/navigation";

export function BalancePaidNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("balancePaid") !== "1") return null;

  return (
    <div className="card mt-6 border-[var(--sage)] bg-[var(--sage)]/10">
      <p className="font-semibold text-[var(--sage)]">Balance paid — thank you!</p>
      <p className="mt-1 text-sm text-[var(--warm-gray)]">Your order is fully paid. See you at pickup/delivery!</p>
    </div>
  );
}
