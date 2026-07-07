"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/menu", label: "My Menu" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/menu-options", label: "Menu Options" },
  { href: "/admin/photos", label: "My Photos" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/custom-requests", label: "Custom Requests" },
  { href: "/admin/schedule", label: "My Schedule" },
  { href: "/admin/settings", label: "Shop Settings" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--blush)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-bold">Brandy&apos;s Dashboard</p>
          <p className="text-xs text-[var(--warm-gray)]">{email}</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                pathname === link.href ? "bg-[var(--chocolate)] text-white" : "text-[var(--warm-gray)] hover:bg-[var(--blush)]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="rounded-full px-3 py-1.5 text-sm text-[var(--warm-gray)] hover:bg-[var(--blush)]">
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
