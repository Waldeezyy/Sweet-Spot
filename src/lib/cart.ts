import type { OrderType } from "@prisma/client";

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  categorySlug?: string;
  orderType: OrderType;
  unitPriceCents: number;
  quantity: number;
  flavor?: string;
  frosting?: string;
  toppings?: string[];
  writing?: string;
  treatTypes?: string[];
  themeColors?: string;
  designNotes?: string;
  allergyNotes?: string;
  inspirationPhotos?: string[];
  cakeSize?: string;
  dozenCount?: number;
  addOns?: string[];
};

export type CartState = {
  items: CartItem[];
  fulfillmentType?: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  scheduledDate?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  preferredContactMethod?: "EMAIL" | "PHONE" | "EITHER";
};

export const CART_STORAGE_KEY = "bssweetspot-cart";

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
}

export function calculateDeposit(totalCents: number, depositPercent: number): number {
  return Math.round(totalCents * (depositPercent / 100));
}

export function hasSemiCustom(items: CartItem[]): boolean {
  return items.some((item) => item.orderType === "SEMI_CUSTOM");
}
