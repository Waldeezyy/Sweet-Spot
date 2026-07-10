import Link from "next/link";
import { CartButton } from "@/components/storefront/CartButton";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/custom-order", label: "Custom Orders" },
  { href: "/gallery", label: "Gallery" },
  { href: "/reviews", label: "Reviews" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--blush)] bg-[var(--cream)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--chocolate)]">
          B&apos;s Sweet Spot
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-[var(--warm-gray)] hover:text-[var(--chocolate)]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <CartButton />
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-[var(--blush)] px-4 py-2 md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap text-sm text-[var(--warm-gray)]">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
