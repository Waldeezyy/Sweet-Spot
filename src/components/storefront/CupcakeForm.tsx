"use client";

import { useState } from "react";
import type { OrderType } from "@prisma/client";
import { formatCents } from "@/lib/utils";
import {
  getCupcakePriceCents,
  CUPCAKE_PRICING,
} from "@/lib/cake-pricing";
import type { OrderPortion } from "@/lib/order-portions";
import {
  getFlavorValidationMessage,
  getMaxSplitCombinations,
  getOrderUnits,
  normalizePortionsToLegacyFields,
} from "@/lib/order-portions";
import { SplitPortionCustomizer } from "@/components/storefront/SplitPortionCustomizer";

const CUPCAKE_FROSTINGS = ["Vanilla buttercream", "Chocolate buttercream", "Whipped"];

type Props = {
  productSlug: string;
  productName: string;
  orderType: OrderType;
  basePriceCents: number;
  maxFlavorOptions: number;
  piecesPerOrderUnit: number;
  flavors: string[];
  onSubmit: (data: {
    flavor: string;
    frosting: string;
    dozenCount: 1 | 2;
    designNotes: string;
    allergyNotes: string;
    unitPriceCents: number;
    displayName: string;
    portions?: OrderPortion[];
  }) => void;
  onCancel: () => void;
};

export function CupcakeForm({
  productSlug,
  productName,
  orderType,
  basePriceCents,
  maxFlavorOptions,
  piecesPerOrderUnit,
  flavors,
  onSubmit,
  onCancel,
}: Props) {
  const [dozenCount, setDozenCount] = useState<1 | 2>(1);
  const [designNotes, setDesignNotes] = useState("");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [error, setError] = useState("");
  const [singleFlavor, setSingleFlavor] = useState(flavors[0] ?? "");
  const [singleFrosting, setSingleFrosting] = useState(CUPCAKE_FROSTINGS[0]);
  const [portions, setPortions] = useState<OrderPortion[] | null>(null);

  const pricing = CUPCAKE_PRICING[productSlug];
  const unitPriceCents = getCupcakePriceCents(productSlug, dozenCount, basePriceCents);
  const maxSplitCombinations = getMaxSplitCombinations(
    maxFlavorOptions,
    getOrderUnits({ formType: "CUPCAKE", dozenCount })
  );

  function handleSubmit() {
    if (orderType === "SEMI_CUSTOM" && !designNotes.trim()) {
      setError("Please describe your custom colors, toppers, or theme.");
      return;
    }

    if (maxSplitCombinations > 1 && portions && portions.length > 0) {
      for (let i = 0; i < portions.length; i++) {
        if (!portions[i].flavor?.trim()) {
          setError(getFlavorValidationMessage(i, portions.length));
          return;
        }
      }
      const legacy = normalizePortionsToLegacyFields(portions);
      setError("");
      onSubmit({
        flavor: legacy.flavor,
        frosting: legacy.frosting ?? singleFrosting,
        dozenCount,
        designNotes: designNotes.trim(),
        allergyNotes: allergyNotes.trim(),
        unitPriceCents,
        displayName: `${productName} (${dozenCount} dozen)`,
        portions,
      });
      return;
    }

    if (!singleFlavor.trim()) {
      setError("Please choose a flavor.");
      return;
    }
    setError("");
    onSubmit({
      flavor: singleFlavor,
      frosting: singleFrosting,
      dozenCount,
      designNotes: designNotes.trim(),
      allergyNotes: allergyNotes.trim(),
      unitPriceCents,
      displayName: `${productName} (${dozenCount} dozen)`,
    });
  }

  return (
    <div className="mt-8 space-y-4 border-t border-[var(--blush)] pt-8">
      <h3 className="font-semibold">Customize your cupcakes</h3>

      <div>
        <label className="label">Quantity (dozens)</label>
        <div className="flex gap-3">
          {([1, 2] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDozenCount(d);
                setPortions(null);
              }}
              className={`rounded-xl border-2 px-4 py-2 text-sm font-medium ${
                dozenCount === d ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"
              }`}
            >
              {d} dozen — {formatCents(getCupcakePriceCents(productSlug, d, basePriceCents))}
            </button>
          ))}
        </div>
      </div>

      <SplitPortionCustomizer
        maxSplitCombinations={maxSplitCombinations}
        categorySlug="cupcakes"
        splittableContext={{ formType: "CUPCAKE", dozenCount, piecesPerOrderUnit }}
        config={{
          allowFlavor: true,
          allowFrosting: true,
          allowTopping: false,
          allowWriting: false,
          flavors,
          frostings: CUPCAKE_FROSTINGS,
          toppings: [],
        }}
        singleValues={{ flavor: singleFlavor, frosting: singleFrosting }}
        onSingleChange={(data) => {
          if (data.flavor !== undefined) setSingleFlavor(data.flavor);
          if (data.frosting !== undefined) setSingleFrosting(data.frosting);
        }}
        portions={portions}
        onPortionsChange={(next) => {
          setPortions(next);
        }}
      />

      {orderType === "SEMI_CUSTOM" && (
        <div>
          <label className="label">Custom design / theme description *</label>
          <textarea
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            className="input min-h-[100px]"
            placeholder="Colors, toppers, theme, or inspiration..."
          />
          {pricing?.isStartingPrice && (
            <p className="mt-1 text-xs text-[var(--warm-gray)]">
              Starting at {formatCents(unitPriceCents)} per dozen — final price confirmed based on detail.
            </p>
          )}
        </div>
      )}

      <div>
        <label className="label">Allergy or dietary notes (optional)</label>
        <textarea
          value={allergyNotes}
          onChange={(e) => setAllergyNotes(e.target.value)}
          className="input min-h-[80px]"
          placeholder="Gluten free, nut allergy, etc."
        />
      </div>

      <p className="text-sm font-semibold text-[var(--rose)]">
        {pricing?.isStartingPrice ? "Starting at " : ""}{formatCents(unitPriceCents)}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={handleSubmit} className="btn-primary">Add to Cart</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
