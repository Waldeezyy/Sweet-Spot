import { formatCents } from "@/lib/utils";
import { RUSH_FEE_CENTS } from "@/lib/rush-order";

export function RushOrderNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-sm text-amber-900">
        Rush order: {formatCents(RUSH_FEE_CENTS)} fee if approved · requires Brandy&apos;s approval · not guaranteed
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Rush order notice</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>A {formatCents(RUSH_FEE_CENTS)} rush fee applies if your order is approved</li>
        <li>Your order requires approval from Brandy before it&apos;s confirmed</li>
        <li>We cannot guarantee that a rush order is possible for your selected date</li>
      </ul>
    </div>
  );
}
