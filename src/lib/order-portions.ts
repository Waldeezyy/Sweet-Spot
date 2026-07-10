import { z } from "zod";
import type { CategoryFormType } from "@prisma/client";

export const orderPortionSchema = z.object({
  count: z.number().int().positive(),
  flavor: z.string().optional(),
  frosting: z.string().optional(),
  toppings: z.array(z.string()).optional(),
  addOns: z.array(z.string()).optional(),
  writing: z.string().optional(),
});

export type OrderPortion = z.infer<typeof orderPortionSchema>;

export type SplittableContext = {
  formType?: CategoryFormType | string;
  dozenCount?: number;
  quantity?: number;
  piecesPerOrderUnit?: number;
};

export function getQuantityLabel(piecesPerOrderUnit: number): string {
  if (piecesPerOrderUnit <= 1) return "How many?";
  return `How many orders? (${piecesPerOrderUnit} pieces each)`;
}

export function getTreatUnitLabel(): string {
  return "pieces";
}

export function getOrderUnits(ctx: SplittableContext): number {
  if (ctx.formType === "CUPCAKE") {
    return ctx.dozenCount ?? 1;
  }
  return ctx.quantity ?? 1;
}

export function getTotalSplittableUnits(ctx: SplittableContext): number {
  const orderUnits = getOrderUnits(ctx);
  const piecesPerOrderUnit = ctx.piecesPerOrderUnit ?? 1;
  return orderUnits * piecesPerOrderUnit;
}

export function getMaxSplitCombinations(maxFlavorOptions: number, orderUnits: number): number {
  return maxFlavorOptions * orderUnits;
}

export function getPortionSize(totalUnits: number, splitCount: number): number | null {
  if (splitCount < 1 || totalUnits < 1) return null;
  if (totalUnits % splitCount !== 0) return null;
  return totalUnits / splitCount;
}

export function canSplitEvenly(totalUnits: number, splitCount: number): boolean {
  return getPortionSize(totalUnits, splitCount) !== null;
}

export function splitCountError(totalUnits: number, splitCount: number): string | null {
  if (splitCount < 2) return null;
  if (totalUnits % splitCount !== 0) {
    return `Cannot split ${totalUnits} treats evenly into ${splitCount} groups. Try a different number of combinations.`;
  }
  return null;
}

export function formatPortionCombo(portion: OrderPortion): string {
  const parts: string[] = [];
  if (portion.flavor) parts.push(portion.flavor);
  if (portion.frosting) parts.push(portion.frosting);
  if (portion.toppings?.length) parts.push(portion.toppings.join(", "));
  if (portion.addOns?.length) parts.push(portion.addOns.join(", "));
  if (portion.writing) parts.push(`"${portion.writing}"`);
  return parts.join(" / ") || "Custom";
}

export function formatPortionsForDisplay(portions: OrderPortion[]): string[] {
  return portions.map((p) => `${p.count}× ${formatPortionCombo(p)}`);
}

export function normalizePortionsToLegacyFields(portions: OrderPortion[]): {
  flavor: string;
  frosting: string | undefined;
  toppings: string | undefined;
  writing: string | undefined;
} {
  const flavor = portions.map((p) => `${p.count}× ${p.flavor ?? formatPortionCombo(p)}`).join(" · ");
  const frostings = [...new Set(portions.map((p) => p.frosting).filter(Boolean))];
  const allToppings = portions.flatMap((p) => p.toppings ?? p.addOns ?? []);
  const writings = portions.map((p) => p.writing).filter(Boolean);
  return {
    flavor,
    frosting: frostings.length ? frostings.join(" · ") : undefined,
    toppings: allToppings.length ? [...new Set(allToppings)].join(", ") : undefined,
    writing: writings.length ? writings.join(" · ") : undefined,
  };
}

export function validatePortions(
  portions: OrderPortion[],
  totalUnits: number,
  opts: {
    requireFlavor?: boolean;
    requireFrosting?: boolean;
  } = {}
): string | null {
  const sum = portions.reduce((s, p) => s + p.count, 0);
  if (sum !== totalUnits) {
    return `Portion counts must add up to ${totalUnits} treats (currently ${sum}).`;
  }
  for (let i = 0; i < portions.length; i++) {
    if (opts.requireFlavor && !portions[i].flavor?.trim()) {
      return `Please choose a flavor for combination ${i + 1}.`;
    }
    if (opts.requireFrosting && !portions[i].frosting?.trim()) {
      return `Please choose a frosting for combination ${i + 1}.`;
    }
  }
  return null;
}

export function buildEqualPortions(
  splitCount: number,
  totalUnits: number,
  template: Omit<OrderPortion, "count">
): OrderPortion[] | null {
  const size = getPortionSize(totalUnits, splitCount);
  if (!size) return null;
  return Array.from({ length: splitCount }, () => ({ count: size, ...template }));
}
