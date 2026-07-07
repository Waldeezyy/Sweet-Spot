"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/storefront/CartProvider";

export function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/order"
      className="relative inline-flex items-center gap-1 rounded-full border border-[var(--blush)] bg-white px-3 py-2 text-sm font-medium text-[var(--chocolate)] hover:border-[var(--rose)]"
      aria-label={`View cart, ${itemCount} items`}
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--rose)] text-xs font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
