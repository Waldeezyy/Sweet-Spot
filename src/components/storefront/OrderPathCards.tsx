import Link from "next/link";
import { ORDERING_PATHS } from "@/lib/ordering-paths";

export function OrderPathCards() {
  const { menu, custom } = ORDERING_PATHS;

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="card flex flex-col text-left">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--chocolate)]">
          {menu.title}
        </h2>
        <p className="mt-3 flex-1 text-sm text-[var(--warm-gray)] leading-relaxed">{menu.description}</p>
        <Link href={menu.href} className="btn-primary mt-6 inline-flex w-full justify-center sm:w-auto">
          {menu.buttonLabel}
        </Link>
      </div>
      <div className="card flex flex-col text-left">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--chocolate)]">
          {custom.title}
        </h2>
        <p className="mt-3 flex-1 text-sm text-[var(--warm-gray)] leading-relaxed">{custom.description}</p>
        <Link href={custom.href} className="btn-secondary mt-6 inline-flex w-full justify-center sm:w-auto">
          {custom.buttonLabel}
        </Link>
      </div>
    </div>
  );
}
