export const PARTY_CATEGORY_SLUG = "party-packages";

export const PARTY_TREAT_TYPES = [
  "Oreos",
  "Rice Krispies",
  "Cake Pops",
  "Pretzels",
  "Wafer Cookies",
  "Marshmallows",
  "Strawberries",
  "Other (describe in notes)",
] as const;

export type PartyPackageConfig = {
  dozenCount: number;
  maxTreatTypes: number;
  maxColors: number;
  decorNote?: string;
  requiresDesignNotes?: boolean;
};

export const PARTY_PACKAGE_CONFIG: Record<string, PartyPackageConfig> = {
  "small-party-package": {
    dozenCount: 2,
    maxTreatTypes: 1,
    maxColors: 2,
    decorNote: "Simple theme colors included.",
  },
  "medium-party-package": {
    dozenCount: 4,
    maxTreatTypes: 2,
    maxColors: 3,
    decorNote: "Themed & basic decor included.",
  },
  "large-party-package": {
    dozenCount: 6,
    maxTreatTypes: 3,
    maxColors: 3,
    decorNote: "Full theme & detailed decor included.",
  },
  "your-party-package": {
    dozenCount: 0,
    maxTreatTypes: PARTY_TREAT_TYPES.length,
    maxColors: 3,
    decorNote: "Custom designs & decals. Mix & match any treat types.",
    requiresDesignNotes: true,
  },
};

export function isPartyPackage(categorySlug: string): boolean {
  return categorySlug === PARTY_CATEGORY_SLUG;
}

export function getPartyPackageConfig(productSlug: string): PartyPackageConfig | null {
  return PARTY_PACKAGE_CONFIG[productSlug] ?? null;
}

export function isPartyProductSlug(productSlug: string): boolean {
  return productSlug in PARTY_PACKAGE_CONFIG;
}

export function formatPartySelections(params: {
  treatTypes?: string[];
  themeColors?: string;
  designNotes?: string;
}): { flavor?: string; frosting?: string; designNotes?: string } {
  return {
    flavor: params.treatTypes?.length ? params.treatTypes.join(", ") : undefined,
    frosting: params.themeColors?.trim() || undefined,
    designNotes: params.designNotes?.trim() || undefined,
  };
}

export function formatPartyItemSummary(item: {
  flavor?: string | null;
  frosting?: string | null;
  designNotes?: string | null;
}): string[] {
  const lines: string[] = [];
  if (item.flavor) lines.push(`Treat types: ${item.flavor}`);
  if (item.frosting) lines.push(`Theme colors: ${item.frosting}`);
  if (item.designNotes) lines.push(`Design: ${item.designNotes}`);
  return lines;
}
