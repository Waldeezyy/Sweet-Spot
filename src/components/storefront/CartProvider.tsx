"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, CartState } from "@/lib/cart";
import { CART_STORAGE_KEY, cartSubtotal } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: (item: CartItem) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  meta: Omit<CartState, "items">;
  setMeta: (meta: Omit<CartState, "items">) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [meta, setMetaState] = useState<Omit<CartState, "items">>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartState;
        setItems(parsed.items ?? []);
        setMetaState({
          fulfillmentType: parsed.fulfillmentType,
          deliveryAddress: parsed.deliveryAddress,
          scheduledDate: parsed.scheduledDate,
          customerName: parsed.customerName,
          customerEmail: parsed.customerEmail,
          customerPhone: parsed.customerPhone,
        });
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, ...meta }));
  }, [items, meta, loaded]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      subtotalCents: cartSubtotal(items),
      addItem: (item) => setItems((prev) => [...prev, item]),
      updateItem: (id, updates) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i))),
      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      clearCart: () => setItems([]),
      meta,
      setMeta: setMetaState,
    }),
    [items, meta]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
