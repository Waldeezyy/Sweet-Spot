export const CUPCAKE_CATEGORY = "cupcakes";
export const ROUND_CAKE_CATEGORY = "round-cakes";
export const SHEET_CAKE_CATEGORY = "sheet-cakes";

export const STANDARD_CUPCAKE_FLAVORS = ["Vanilla", "Chocolate", "Marble"] as const;

export const SPECIALTY_CUPCAKE_FLAVORS = [
  "Strawberry",
  "Red Velvet",
  "Lemon",
  "Funfetti",
  "Oreo",
  "Peach",
  "Blueberry",
] as const;

export const ROUND_CAKE_SIZES = [
  { id: "6", label: '6" round', serves: "8–12", basicCents: 4000, customStartCents: 5000 },
  { id: "8", label: '8" round', serves: "15–20", basicCents: 5500, customStartCents: 6500 },
  { id: "10", label: '10" round', serves: "25–30", basicCents: 7000, customStartCents: 8500 },
] as const;

export type RoundCakeSizeId = (typeof ROUND_CAKE_SIZES)[number]["id"];

export const SHEET_CAKE_INFO: Record<string, { label: string; serves: string; basicCents: number; customStartCents: number }> = {
  "basic-quarter-sheet-cake": { label: "Quarter sheet", serves: "20–25", basicCents: 5000, customStartCents: 6500 },
  "custom-quarter-sheet-cake": { label: "Quarter sheet", serves: "20–25", basicCents: 5000, customStartCents: 6500 },
  "basic-half-sheet": { label: "Half sheet", serves: "40–50", basicCents: 8000, customStartCents: 9500 },
  "custom-half-sheet-cake": { label: "Half sheet", serves: "40–50", basicCents: 8000, customStartCents: 9500 },
};

export const CUPCAKE_PRICING: Record<string, { oneDozenCents: number; twoDozenCents: number; isStartingPrice?: boolean }> = {
  "standard-cupcakes": { oneDozenCents: 2500, twoDozenCents: 4500 },
  "specialty-cupcakes": { oneDozenCents: 3000, twoDozenCents: 5500 },
  "custom-cupcakes": { oneDozenCents: 3500, twoDozenCents: 7000, isStartingPrice: true },
};

export const ADD_ONS = [
  { id: "filling", name: "Filling (strawberry, cream cheese, etc.)", priceCents: 750, priceLabel: "+$5–$10" },
  { id: "edible-image", name: "Edible image", priceCents: 1000, priceLabel: "+$10" },
  { id: "cake-topper", name: "Cake topper", priceCents: 1000, priceLabel: "+$5–$15" },
  { id: "extra-design", name: "Extra detailed design", priceCents: 1000, priceLabel: "+$10+" },
] as const;

export type AddOnId = (typeof ADD_ONS)[number]["id"];

export function isCupcakeCategory(categorySlug: string): boolean {
  return categorySlug === CUPCAKE_CATEGORY;
}

export function isRoundCakeCategory(categorySlug: string): boolean {
  return categorySlug === ROUND_CAKE_CATEGORY;
}

export function isSheetCakeCategory(categorySlug: string): boolean {
  return categorySlug === SHEET_CAKE_CATEGORY;
}

export function isCakeCategory(categorySlug: string): boolean {
  return isCupcakeCategory(categorySlug) || isRoundCakeCategory(categorySlug) || isSheetCakeCategory(categorySlug);
}

export function getCupcakeFlavors(productSlug: string, allFlavors: string[]): string[] {
  if (productSlug === "standard-cupcakes") return [...STANDARD_CUPCAKE_FLAVORS];
  if (productSlug === "specialty-cupcakes") return [...SPECIALTY_CUPCAKE_FLAVORS];
  return allFlavors;
}

export function getCupcakePriceCents(productSlug: string, dozens: 1 | 2): number {
  const pricing = CUPCAKE_PRICING[productSlug];
  if (!pricing) return 0;
  return dozens === 1 ? pricing.oneDozenCents : pricing.twoDozenCents;
}

export function getRoundCakePriceCents(sizeId: RoundCakeSizeId, isCustom: boolean): number {
  const size = ROUND_CAKE_SIZES.find((s) => s.id === sizeId);
  if (!size) return 0;
  return isCustom ? size.customStartCents : size.basicCents;
}

export function getSheetCakePriceCents(productSlug: string, isCustom: boolean): number {
  const info = SHEET_CAKE_INFO[productSlug];
  if (!info) return 0;
  return isCustom ? info.customStartCents : info.basicCents;
}

export function sumAddOnCents(addOnIds: AddOnId[]): number {
  return addOnIds.reduce((sum, id) => {
    const addOn = ADD_ONS.find((a) => a.id === id);
    return sum + (addOn?.priceCents ?? 0);
  }, 0);
}

export function formatAddOnNames(addOnIds: AddOnId[]): string[] {
  return addOnIds.map((id) => ADD_ONS.find((a) => a.id === id)?.name).filter(Boolean) as string[];
}

export function formatCakeItemSummary(item: {
  productSlug?: string;
  categorySlug?: string;
  flavor?: string | null;
  frosting?: string | null;
  toppings?: string[] | string | null;
  writing?: string | null;
  designNotes?: string | null;
  cakeSize?: string | null;
  dozenCount?: number | null;
}): string[] {
  const lines: string[] = [];

  if (item.dozenCount) {
    lines.push(`${item.dozenCount} dozen`);
  }

  if (item.cakeSize) {
    const size = ROUND_CAKE_SIZES.find((s) => s.id === item.cakeSize);
    if (size) lines.push(`${size.label} (serves ${size.serves})`);
  }

  if (item.productSlug && SHEET_CAKE_INFO[item.productSlug]) {
    const info = SHEET_CAKE_INFO[item.productSlug];
    lines.push(`${info.label} (serves ${info.serves})`);
  }

  if (item.flavor) lines.push(`Flavor: ${item.flavor}`);
  if (item.frosting) lines.push(`Frosting: ${item.frosting}`);

  const toppings = Array.isArray(item.toppings)
    ? item.toppings
    : item.toppings
      ? item.toppings.split(", ")
      : [];
  if (toppings.length) lines.push(`Add-ons: ${toppings.join(", ")}`);

  if (item.writing) lines.push(`Writing: ${item.writing}`);
  if (item.designNotes) lines.push(`Design: ${item.designNotes}`);

  return lines;
}

export const MENU_PRICING_GUIDE = {
  cupcakes: [
    { tier: "Standard (Vanilla, Chocolate, Marble)", oneDozen: 2500, twoDozen: 4500 },
    { tier: "Specialty (Strawberry, Red Velvet, Lemon, etc.)", oneDozen: 3000, twoDozen: 5500 },
    { tier: "Custom / Themed", oneDozen: 3500, twoDozen: 7000, note: "$35–$45 per dozen depending on detail" },
  ],
  roundCakes: ROUND_CAKE_SIZES.map((s) => ({
    size: s.label,
    serves: s.serves,
    basicCents: s.basicCents,
    customStartCents: s.customStartCents,
  })),
  sheetCakes: [
    { size: "Quarter sheet", serves: "20–25", basicCents: 5000, customStartCents: 6500 },
    { size: "Half sheet", serves: "40–50", basicCents: 8000, customStartCents: 9500 },
  ],
  addOns: ADD_ONS.map((a) => ({ name: a.name, priceLabel: a.priceLabel })),
};
