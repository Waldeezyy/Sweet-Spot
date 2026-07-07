import { prisma } from "@/lib/db";
import { ADD_ONS as FALLBACK_ADD_ONS } from "@/lib/cake-pricing";
import { PARTY_TREAT_TYPES as FALLBACK_TREAT_TYPES } from "@/lib/party-packages";
import { optionAppliesToProduct } from "@/lib/menu-option-scope";

export type MenuAddOn = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  priceLabel: string;
  categorySlugs: string[];
  productSlugs: string[];
};

export async function getActiveAddOns(): Promise<MenuAddOn[]> {
  const rows = await prisma.addOnOption.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length === 0) {
    return FALLBACK_ADD_ONS.map((a) => ({
      id: a.id,
      slug: a.id,
      name: a.name,
      priceCents: a.priceCents,
      priceLabel: a.priceLabel,
      categorySlugs: ["round-cakes", "sheet-cakes"],
      productSlugs: [],
    }));
  }
  return rows.map((r) => ({
    id: r.slug,
    slug: r.slug,
    name: r.name,
    priceCents: r.priceCents,
    priceLabel: r.priceLabel,
    categorySlugs: r.categorySlugs,
    productSlugs: r.productSlugs,
  }));
}

export async function getActiveTreatTypes(): Promise<
  { name: string; categorySlugs: string[]; productSlugs: string[] }[]
> {
  const rows = await prisma.treatTypeOption.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length === 0) {
    return FALLBACK_TREAT_TYPES.map((name) => ({
      name,
      categorySlugs: ["party-packages"],
      productSlugs: [],
    }));
  }
  return rows.map((r) => ({
    name: r.name,
    categorySlugs: r.categorySlugs,
    productSlugs: r.productSlugs,
  }));
}

export async function getActiveFlavors(): Promise<
  { name: string; categorySlugs: string[]; productSlugs: string[] }[]
> {
  return prisma.flavorOption.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { name: true, categorySlugs: true, productSlugs: true },
  });
}

export function filterFlavorsForProduct(
  flavors: { name: string; categorySlugs: string[]; productSlugs: string[] }[],
  categorySlug: string,
  productSlug: string
): string[] {
  return flavors
    .filter((f) => optionAppliesToProduct(f, categorySlug, productSlug))
    .map((f) => f.name);
}

export function filterAddOnsForProduct(addOns: MenuAddOn[], categorySlug: string, productSlug: string): MenuAddOn[] {
  return addOns.filter((a) => optionAppliesToProduct(a, categorySlug, productSlug));
}

export function filterTreatTypesForProduct(
  treatTypes: { name: string; categorySlugs: string[]; productSlugs: string[] }[],
  categorySlug: string,
  productSlug: string
): string[] {
  return treatTypes
    .filter((t) => optionAppliesToProduct(t, categorySlug, productSlug))
    .map((t) => t.name);
}

export function sumAddOnCentsFromList(addOnSlugs: string[], addOns: MenuAddOn[]): number {
  return addOnSlugs.reduce((sum, slug) => {
    const addOn = addOns.find((a) => a.slug === slug || a.id === slug);
    return sum + (addOn?.priceCents ?? 0);
  }, 0);
}

export function formatAddOnNamesFromList(addOnSlugs: string[], addOns: MenuAddOn[]): string[] {
  return addOnSlugs
    .map((slug) => addOns.find((a) => a.slug === slug || a.id === slug)?.name)
    .filter(Boolean) as string[];
}
