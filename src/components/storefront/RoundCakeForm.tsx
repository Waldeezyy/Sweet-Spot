"use client";

import { useState } from "react";
import { formatCents } from "@/lib/utils";
import type { MenuAddOn } from "@/lib/menu-options";
import { sumAddOnCentsFromList } from "@/lib/menu-options";
import {
  ROUND_CAKE_SIZES,
  type RoundCakeSizeId,
  getRoundCakePriceCents,
} from "@/lib/cake-pricing";

type Props = {
  productSlug: string;
  productName: string;
  basePriceCents: number;
  flavors: string[];
  addOnOptions: MenuAddOn[];
  onSubmit: (data: {
    flavor: string;
    frosting: string;
    cakeSize: RoundCakeSizeId;
    addOns: string[];
    writing: string;
    designNotes: string;
    allergyNotes: string;
    unitPriceCents: number;
    displayName: string;
  }) => void;
  onCancel: () => void;
};

export function RoundCakeForm({ productSlug, productName, basePriceCents, flavors, addOnOptions, onSubmit, onCancel }: Props) {
  const isCustom = productSlug === "custom-round-cake";
  const [cakeSize, setCakeSize] = useState<RoundCakeSizeId>("6");
  const [flavor, setFlavor] = useState(flavors[0] ?? "");
  const [frosting, setFrosting] = useState("Buttercream");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [writing, setWriting] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [error, setError] = useState("");

  const baseCents = getRoundCakePriceCents(cakeSize, isCustom, basePriceCents);
  const addOnCents = sumAddOnCentsFromList(selectedAddOns, addOnOptions);
  const unitPriceCents = baseCents + addOnCents;
  const sizeInfo = ROUND_CAKE_SIZES.find((s) => s.id === cakeSize);

  function toggleAddOn(slug: string) {
    setSelectedAddOns((prev) => (prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug]));
  }

  function handleSubmit() {
    if (isCustom && !designNotes.trim()) {
      setError("Please describe your custom colors, theme, or design.");
      return;
    }
    setError("");
    onSubmit({
      flavor,
      frosting,
      cakeSize,
      addOns: selectedAddOns,
      writing: writing.trim(),
      designNotes: designNotes.trim(),
      allergyNotes: allergyNotes.trim(),
      unitPriceCents,
      displayName: `${productName} (${sizeInfo?.label ?? cakeSize})`,
    });
  }

  return (
    <div className="mt-8 space-y-4 border-t border-[var(--blush)] pt-8">
      <h3 className="font-semibold">Customize your round cake</h3>
      <p className="text-sm text-[var(--warm-gray)]">Buttercream finish</p>

      <div>
        <label className="label">Size</label>
        <div className="space-y-2">
          {ROUND_CAKE_SIZES.map((size) => {
            const price = isCustom ? size.customStartCents : size.basicCents;
            return (
              <label
                key={size.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3 ${
                  cakeSize === size.id ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="cakeSize"
                    checked={cakeSize === size.id}
                    onChange={() => setCakeSize(size.id)}
                  />
                  <span>
                    {size.label} <span className="text-sm text-[var(--warm-gray)]">(serves {size.serves})</span>
                  </span>
                </span>
                <span className="font-semibold text-[var(--rose)]">
                  {isCustom ? "from " : ""}{formatCents(price)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label">Flavor</label>
        <select value={flavor} onChange={(e) => setFlavor(e.target.value)} className="input">
          {flavors.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Frosting</label>
        <select value={frosting} onChange={(e) => setFrosting(e.target.value)} className="input">
          <option>Buttercream</option>
          <option>Whipped</option>
        </select>
      </div>

      <div>
        <label className="label">Add-ons (optional)</label>
        <div className="flex flex-wrap gap-2">
          {addOnOptions.map((addOn) => (
            <label
              key={addOn.slug}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                selectedAddOns.includes(addOn.slug) ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedAddOns.includes(addOn.slug)}
                onChange={() => toggleAddOn(addOn.slug)}
              />
              {addOn.name} <span className="text-[var(--warm-gray)]">({addOn.priceLabel})</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Writing on top (optional)</label>
        <input value={writing} onChange={(e) => setWriting(e.target.value)} className="input" placeholder="Happy Birthday!" />
      </div>

      {isCustom && (
        <div>
          <label className="label">Custom design / theme description *</label>
          <textarea
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            className="input min-h-[100px]"
            placeholder="Describe colors, theme, or inspiration..."
          />
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
        {isCustom ? "Starting at " : ""}{formatCents(unitPriceCents)}
        {addOnCents > 0 && <span className="font-normal text-[var(--warm-gray)]"> (includes add-ons)</span>}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={handleSubmit} className="btn-primary">Add to Cart</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
