"use client";

import { useEffect } from "react";
import { useCart } from "@/components/storefront/CartProvider";

export function CartClearer() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
