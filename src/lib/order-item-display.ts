import { isPartyPackage, formatPartyItemSummary } from "@/lib/party-packages";
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
