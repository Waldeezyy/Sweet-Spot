"use client";

import { useState } from "react";
import { formatCents } from "@/lib/utils";
import type { MenuAddOn } from "@/lib/menu-options";
import { sumAddOnCentsFromList } from "@/lib/menu-options";
import { SHEET_CAKE_INFO, getSheetCakePriceCents } from "@/lib/cake-pricing";

type Props = {
  productSlug: string;
  productName: string;
  flavors: string[];
  addOnOptions: MenuAddOn[];
  onSubmit: (data: {
    flavor: string;
    frosting: string;
    addOns: string[];
    writing: string;
    designNotes: string;
    allergyNotes: string;
    unitPriceCents: number;
    displayName: string;
  }) => void;
  onCancel: () => void;
};

export function SheetCakeForm({ productSlug, productName, flavors, addOnOptions, onSubmit, onCancel }: Props) {
  const isCustom = productSlug.startsWith("custom-");
  const sheetInfo = SHEET_CAKE_INFO[productSlug];
  const [flavor, setFlavor] = useState(flavors[0] ?? "");
  const [frosting, setFrosting] = useState("Buttercream");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [writing, setWriting] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [error, setError] = useState("");

  const baseCents = getSheetCakePriceCents(productSlug, isCustom);
  const addOnCents = sumAddOnCentsFromList(selectedAddOns, addOnOptions);
  const unitPriceCents = baseCents + addOnCents;

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
      addOns: selectedAddOns,
      writing: writing.trim(),
      designNotes: designNotes.trim(),
      allergyNotes: allergyNotes.trim(),
      unitPriceCents,
      displayName: productName,
    });
  }

  return (
    <div className="mt-8 space-y-4 border-t border-[var(--blush)] pt-8">
      <h3 className="font-semibold">Customize your sheet cake</h3>
      {sheetInfo && (
        <p className="rounded-xl bg-[var(--blush)]/40 p-3 text-sm text-[var(--warm-gray)]">
          {sheetInfo.label} — serves {sheetInfo.serves}
        </p>
      )}

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
