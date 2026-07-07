"use client";

import { useState } from "react";
import type { OrderType } from "@prisma/client";
import type { PartyPackageConfig } from "@/lib/party-packages";
import { PARTY_TREAT_TYPES } from "@/lib/party-packages";

type Props = {
  productName: string;
  orderType: OrderType;
  config: PartyPackageConfig;
  onSubmit: (data: {
    treatTypes: string[];
    themeColors: string;
    designNotes: string;
    allergyNotes: string;
    quantity: number;
  }) => void;
  onCancel: () => void;
};

export function PartyPackageForm({ productName, orderType, config, onSubmit, onCancel }: Props) {
  const [selectedTreats, setSelectedTreats] = useState<string[]>([]);
  const [themeColors, setThemeColors] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  function toggleTreat(treat: string) {
    setSelectedTreats((prev) => {
      if (prev.includes(treat)) return prev.filter((t) => t !== treat);
      if (prev.length >= config.maxTreatTypes) return prev;
      return [...prev, treat];
    });
  }

  function handleSubmit() {
    if (selectedTreats.length === 0) {
      setError("Please choose at least one treat type.");
      return;
    }
    if (!themeColors.trim()) {
      setError(`Please enter your theme colors (up to ${config.maxColors}).`);
      return;
    }
    if (config.requiresDesignNotes && !designNotes.trim()) {
      setError("Please describe your custom design, theme, or decals.");
      return;
    }
    setError("");
    onSubmit({
      treatTypes: selectedTreats,
      themeColors: themeColors.trim(),
      designNotes: designNotes.trim(),
      allergyNotes: allergyNotes.trim(),
      quantity,
    });
  }

  const treatLabel =
    config.maxTreatTypes === 1
      ? "Choose your treat type (1)"
      : `Choose treat types (up to ${config.maxTreatTypes})`;

  return (
    <div className="mt-8 space-y-4 border-t border-[var(--blush)] pt-8">
      <h3 className="font-semibold">Customize your {productName}</h3>

      {config.dozenCount > 0 && (
        <p className="rounded-xl bg-[var(--blush)]/40 p-3 text-sm text-[var(--warm-gray)]">
          Includes {config.dozenCount} dozen treats. {config.decorNote}
        </p>
      )}
      {config.dozenCount === 0 && config.decorNote && (
        <p className="rounded-xl bg-[var(--blush)]/40 p-3 text-sm text-[var(--warm-gray)]">{config.decorNote}</p>
      )}

      <div>
        <label className="label">Number of packs</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="input max-w-[120px]"
        />
      </div>

      <div>
        <label className="label">{treatLabel}</label>
        <div className="flex flex-wrap gap-2">
          {PARTY_TREAT_TYPES.map((treat) => {
            const selected = selectedTreats.includes(treat);
            const atLimit = !selected && selectedTreats.length >= config.maxTreatTypes;
            return (
              <label
                key={treat}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                  selected ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"
                } ${atLimit ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={atLimit}
                  onChange={() => toggleTreat(treat)}
                />
                {treat}
              </label>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-[var(--warm-gray)]">
          {selectedTreats.length}/{config.maxTreatTypes} selected
        </p>
      </div>

      <div>
        <label className="label">Theme colors (up to {config.maxColors})</label>
        <input
          value={themeColors}
          onChange={(e) => setThemeColors(e.target.value)}
          className="input"
          placeholder="e.g. pink, white, gold"
        />
      </div>

      {(orderType === "SEMI_CUSTOM" || config.requiresDesignNotes) && (
        <div>
          <label className="label">Custom design / theme description *</label>
          <textarea
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            className="input min-h-[100px]"
            placeholder="Describe your theme, decals, or inspiration..."
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={handleSubmit} className="btn-primary">
          Add to Cart
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
