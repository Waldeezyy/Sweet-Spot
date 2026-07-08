"use client";

import { useState } from "react";
import type { OrderType } from "@prisma/client";
import { formatCents } from "@/lib/utils";
import {
  getCupcakePriceCents,
  CUPCAKE_PRICING,
} from "@/lib/cake-pricing";

type Props = {
  productSlug: string;
  productName: string;
  orderType: OrderType;
  basePriceCents: number;
  flavors: string[];
  onSubmit: (data: {
    flavor: string;
    frosting: string;
    dozenCount: 1 | 2;
    designNotes: string;
    allergyNotes: string;
    unitPriceCents: number;
    displayName: string;
  }) => void;
  onCancel: () => void;
};

export function CupcakeForm({ productSlug, productName, orderType, basePriceCents, flavors, onSubmit, onCancel }: Props) {
  const flavorOptions = flavors;
  const [flavor, setFlavor] = useState(flavorOptions[0] ?? "");
  const [frosting, setFrosting] = useState("Vanilla buttercream");
  const [dozenCount, setDozenCount] = useState<1 | 2>(1);
  const [designNotes, setDesignNotes] = useState("");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [error, setError] = useState("");

  const pricing = CUPCAKE_PRICING[productSlug];
  const unitPriceCents = getCupcakePriceCents(productSlug, dozenCount, basePriceCents);

  function handleSubmit() {
    if (orderType === "SEMI_CUSTOM" && !designNotes.trim()) {
      setError("Please describe your custom colors, toppers, or theme.");
      return;
    }
    setError("");
    onSubmit({
      flavor,
      frosting,
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
              onClick={() => setDozenCount(d)}
              className={`rounded-xl border-2 px-4 py-2 text-sm font-medium ${
                dozenCount === d ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"
              }`}
            >
              {d} dozen — {formatCents(getCupcakePriceCents(productSlug, d, basePriceCents))}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Flavor</label>
        <select value={flavor} onChange={(e) => setFlavor(e.target.value)} className="input">
          {flavorOptions.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Frosting</label>
        <select value={frosting} onChange={(e) => setFrosting(e.target.value)} className="input">
          <option>Vanilla buttercream</option>
          <option>Chocolate buttercream</option>
          <option>Whipped</option>
        </select>
      </div>

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
