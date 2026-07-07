import { isPartyPackage, formatPartyItemSummary, isPartyProductSlug } from "@/lib/party-packages";
import { isCakeCategory, formatCakeItemSummary } from "@/lib/cake-pricing";
import type { CartItem } from "@/lib/cart";

export function formatCartItemDetails(item: CartItem): string[] {
  if (isPartyPackage(item.categorySlug ?? "") || item.treatTypes?.length) {
    return formatPartyItemSummary({
      flavor: item.treatTypes?.join(", ") ?? item.flavor,
      frosting: item.themeColors ?? item.frosting,
      designNotes: item.designNotes,
    });
  }

  if (isCakeCategory(item.categorySlug ?? "")) {
    return formatCakeItemSummary({
      productSlug: item.productSlug,
      categorySlug: item.categorySlug,
      flavor: item.flavor,
      frosting: item.frosting,
      toppings: item.addOns ?? item.toppings,
      writing: item.writing,
      designNotes: item.designNotes,
      cakeSize: item.cakeSize,
      dozenCount: item.dozenCount,
    });
  }

  const lines: string[] = [];
  if (item.flavor) lines.push(`Flavor: ${item.flavor}`);
  if (item.frosting) lines.push(`Frosting: ${item.frosting}`);
  if (item.toppings?.length) lines.push(`Toppings: ${item.toppings.join(", ")}`);
  if (item.writing) lines.push(`Writing: ${item.writing}`);
  if (item.designNotes) lines.push(`Design: ${item.designNotes}`);
  return lines;
}

export function formatOrderItemLine(item: {
  productName: string;
  productSlug?: string | null;
  quantity: number;
  flavor?: string | null;
  frosting?: string | null;
  toppings?: string | null;
  writing?: string | null;
  designNotes?: string | null;
}): string {
  if (item.productSlug && isPartyProductSlug(item.productSlug)) {
    const details = formatPartyItemSummary(item);
    return `${item.productName} × ${item.quantity}${details.length ? ` — ${details.join(" · ")}` : ""}`;
  }
  const parts = [`${item.productName} × ${item.quantity}`];
  if (item.flavor) parts.push(`Flavor: ${item.flavor}`);
  if (item.frosting) parts.push(`Frosting: ${item.frosting}`);
  if (item.toppings) parts.push(`Add-ons: ${item.toppings}`);
  if (item.writing) parts.push(`Writing: ${item.writing}`);
  if (item.designNotes) parts.push(item.designNotes);
  return parts.join(" — ");
}
