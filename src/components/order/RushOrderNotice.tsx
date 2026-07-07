import { formatCents } from "@/lib/utils";
import { RUSH_FEE_CENTS } from "@/lib/rush-order";

export function RushOrderNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-sm text-amber-900">
        Submit request only — no payment until approved · {formatCents(RUSH_FEE_CENTS)} rush fee if approved · not guaranteed
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Rush order notice</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Submit your request with no payment — Brandy will review your date</li>
        <li>If approved, a {formatCents(RUSH_FEE_CENTS)} rush fee is added and you will receive a link to pay</li>
        <li>We cannot guarantee that a rush order is possible for your selected date</li>
      </ul>
    </div>
  );
}
