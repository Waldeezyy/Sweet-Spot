import { z } from "zod";
import type { CategoryFormType } from "@prisma/client";
import { CUPCAKE_PRICING, ROUND_CAKE_SIZES } from "@/lib/cake-pricing";

export const productPriceTierSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  serves: z.string().optional(),
  priceCents: z.number().int().positive(),
});

export type ProductPriceTier = z.infer<typeof productPriceTierSchema>;

export const priceTiersSchema = z.array(productPriceTierSchema).min(1);

export function parsePriceTiers(json: unknown): ProductPriceTier[] | null {
  if (json == null) return null;
  const parsed = z.array(productPriceTierSchema).safeParse(json);
  return parsed.success && parsed.data.length > 0 ? parsed.data : null;
}

export function getTierPrice(tiers: ProductPriceTier[], tierId: string): number {
  return tiers.find((t) => t.id === tierId)?.priceCents ?? 0;
}

export function getTierById(tiers: ProductPriceTier[], tierId: string): ProductPriceTier | undefined {
  return tiers.find((t) => t.id === tierId);
}

export function getDefaultTierId(tiers: ProductPriceTier[]): string {
  return tiers[0]?.id ?? "";
}

export function minTierPriceCents(tiers: ProductPriceTier[]): number {
  return Math.min(...tiers.map((t) => t.priceCents));
}

export function getLegacyRoundCakeTiers(productSlug: string, orderType?: string): ProductPriceTier[] {
  const isCustom = orderType === "SEMI_CUSTOM" || productSlug === "custom-round-cake";
  return ROUND_CAKE_SIZES.map((s) => ({
    id: s.id,
    label: s.label,
    serves: s.serves,
    priceCents: isCustom ? s.customStartCents : s.basicCents,
  }));
}

export function getLegacyCupcakeTiers(productSlug: string, basePriceCents?: number): ProductPriceTier[] {
  const pricing = CUPCAKE_PRICING[productSlug];
  if (pricing) {
    return [
      { id: "1", label: "1 dozen", priceCents: pricing.oneDozenCents },
      { id: "2", label: "2 dozen", priceCents: pricing.twoDozenCents },
    ];
  }
  if (basePriceCents && basePriceCents > 0) {
    return [
      { id: "1", label: "1 dozen", priceCents: basePriceCents },
      { id: "2", label: "2 dozen", priceCents: basePriceCents * 2 },
    ];
  }
  return [
    { id: "1", label: "1 dozen", priceCents: 2500 },
    { id: "2", label: "2 dozen", priceCents: 4500 },
  ];
}

export function resolveProductPriceTiers(
  product: { slug: string; orderType?: string; basePriceCents?: number; priceTiers?: unknown },
  formType: CategoryFormType
): ProductPriceTier[] | null {
  const stored = parsePriceTiers(product.priceTiers);
  if (stored) return stored;

  if (formType === "ROUND_CAKE") {
    return getLegacyRoundCakeTiers(product.slug, product.orderType);
  }
  if (formType === "CUPCAKE") {
    return getLegacyCupcakeTiers(product.slug, product.basePriceCents);
  }
  return null;
}

export function defaultRoundCakeTiers(orderType?: string): ProductPriceTier[] {
  return getLegacyRoundCakeTiers("basic-round-cakes", orderType);
}

export function defaultCupcakeTiers(basePriceCents?: number): ProductPriceTier[] {
  return getLegacyCupcakeTiers("standard-cupcakes", basePriceCents);
}

export function validatePriceTiers(formType: CategoryFormType, tiers: ProductPriceTier[]): string | null {
  if (formType === "ROUND_CAKE") {
    if (tiers.length < 1) return "Add at least one size and price.";
    for (const tier of tiers) {
      if (!tier.label.trim()) return "Each size needs a name.";
      if (!tier.priceCents || tier.priceCents <= 0) return "Each size needs a price greater than zero.";
    }
    return null;
  }

  if (formType === "CUPCAKE") {
    const one = tiers.find((t) => t.id === "1");
    const two = tiers.find((t) => t.id === "2");
    if (!one?.priceCents || one.priceCents <= 0) return "Enter a price for 1 dozen.";
    if (!two?.priceCents || two.priceCents <= 0) return "Enter a price for 2 dozen.";
    return null;
  }

  return null;
}

export function normalizeCupcakeTiers(tiers: ProductPriceTier[]): ProductPriceTier[] {
  const one = tiers.find((t) => t.id === "1");
  const two = tiers.find((t) => t.id === "2");
  return [
    { id: "1", label: "1 dozen", priceCents: one?.priceCents ?? 0 },
    { id: "2", label: "2 dozen", priceCents: two?.priceCents ?? 0 },
  ];
}

export function newRoundCakeTierId(): string {
  return `size-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
