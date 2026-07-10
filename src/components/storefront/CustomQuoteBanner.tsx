import Link from "next/link";
import { ORDERING_PATHS } from "@/lib/ordering-paths";

export function CustomQuoteBanner() {
  const { custom } = ORDERING_PATHS;

  return (
    <div className="mt-6 rounded-xl border border-[var(--blush)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--warm-gray)]">
      {custom.bannerPrompt}{" "}
      <Link href={custom.href} className="font-medium text-[var(--rose)] hover:underline">
        {custom.bannerLinkLabel} →
      </Link>
    </div>
  );
}
