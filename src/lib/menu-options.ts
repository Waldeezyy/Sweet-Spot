import { prisma } from "@/lib/db";
import { ADD_ONS as FALLBACK_ADD_ONS } from "@/lib/cake-pricing";
import { PARTY_TREAT_TYPES as FALLBACK_TREAT_TYPES } from "@/lib/party-packages";

export type MenuAddOn = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  priceLabel: string;
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
    }));
  }
  return rows.map((r) => ({
    id: r.slug,
    slug: r.slug,
    name: r.name,
    priceCents: r.priceCents,
    priceLabel: r.priceLabel,
  }));
}

export async function getActiveTreatTypes(): Promise<string[]> {
  const rows = await prisma.treatTypeOption.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length === 0) return [...FALLBACK_TREAT_TYPES];
  return rows.map((r) => r.name);
}

export async function getActiveFlavors(): Promise<{ name: string; flavorGroup: string | null }[]> {
  return prisma.flavorOption.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { name: true, flavorGroup: true },
  });
}

export function filterFlavorsByGroup(
  flavors: { name: string; flavorGroup: string | null }[],
  group: "standard" | "specialty" | null
): string[] {
  if (!group) return flavors.map((f) => f.name);
  return flavors.filter((f) => f.flavorGroup === group || f.flavorGroup === null).map((f) => f.name);
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
