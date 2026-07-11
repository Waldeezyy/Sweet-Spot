"use client";

import type { ProductPriceTier } from "@/lib/product-price-tiers";
import {
  defaultCupcakeTiers,
  defaultRoundCakeTiers,
  newRoundCakeTierId,
  normalizeCupcakeTiers,
} from "@/lib/product-price-tiers";

type Props = {
  formType: "ROUND_CAKE" | "CUPCAKE";
  orderType: string;
  basePriceCents: number;
  tiers: ProductPriceTier[];
  onChange: (tiers: ProductPriceTier[]) => void;
};

export function ProductPriceTiersEditor({ formType, orderType, basePriceCents, tiers, onChange }: Props) {
  if (formType === "ROUND_CAKE") {
    const rows = tiers.length > 0 ? tiers : defaultRoundCakeTiers(orderType);

    function updateRow(index: number, patch: Partial<ProductPriceTier>) {
      const next = rows.map((t, i) => (i === index ? { ...t, ...patch } : t));
      onChange(next);
    }

    function removeRow(index: number) {
      if (rows.length <= 1) return;
      onChange(rows.filter((_, i) => i !== index));
    }

    function moveRow(index: number, direction: -1 | 1) {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      onChange(next);
    }

    function addRow() {
      onChange([
        ...rows,
        { id: newRoundCakeTierId(), label: "", serves: "", priceCents: 0 },
      ]);
    }

    return (
      <fieldset className="space-y-3 rounded-xl border border-[var(--blush)] bg-[var(--cream)]/50 p-4">
        <legend className="label px-1">Sizes &amp; prices</legend>
        {rows.map((tier, index) => (
          <div key={tier.id} className="flex flex-wrap items-end gap-2 border-b border-[var(--blush)]/50 pb-3 last:border-0 last:pb-0">
            <div className="min-w-[120px] flex-1">
              <label className="label text-xs">Size name</label>
              <input
                value={tier.label}
                onChange={(e) => updateRow(index, { label: e.target.value })}
                className="input"
                placeholder={'6" round'}
                required
              />
            </div>
            <div className="min-w-[100px] flex-1">
              <label className="label text-xs">Serves</label>
              <input
                value={tier.serves ?? ""}
                onChange={(e) => updateRow(index, { serves: e.target.value })}
                className="input"
                placeholder="8–12"
              />
            </div>
            <div className="w-28">
              <label className="label text-xs">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tier.priceCents ? (tier.priceCents / 100).toFixed(2) : ""}
                onChange={(e) =>
                  updateRow(index, { priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                }
                className="input"
                required
              />
            </div>
            <div className="flex gap-1 pb-1">
              <button type="button" onClick={() => moveRow(index, -1)} disabled={index === 0} className="btn-secondary px-2 py-1 text-xs" aria-label="Move up">
                ↑
              </button>
              <button type="button" onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1} className="btn-secondary px-2 py-1 text-xs" aria-label="Move down">
                ↓
              </button>
              <button type="button" onClick={() => removeRow(index)} disabled={rows.length <= 1} className="btn-secondary px-2 py-1 text-xs text-red-600" aria-label="Remove size">
                ×
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addRow} className="btn-secondary text-sm">
          + Add size
        </button>
        <p className="text-xs text-[var(--warm-gray)]">
          Menu card shows the lowest size price. Customers pick a size when ordering.
        </p>
      </fieldset>
    );
  }

  const cupcakeRows = normalizeCupcakeTiers(tiers.length > 0 ? tiers : defaultCupcakeTiers(basePriceCents));

  function updateCupcakePrice(id: "1" | "2", dollars: string) {
    const cents = Math.round(parseFloat(dollars || "0") * 100);
    onChange(
      cupcakeRows.map((t) => (t.id === id ? { ...t, priceCents: cents } : t))
    );
  }

  return (
    <fieldset className="space-y-3 rounded-xl border border-[var(--blush)] bg-[var(--cream)]/50 p-4">
      <legend className="label px-1">Dozen pricing</legend>
      {(["1", "2"] as const).map((id) => {
        const tier = cupcakeRows.find((t) => t.id === id)!;
        return (
          <div key={id} className="flex items-end gap-3">
            <span className="w-24 text-sm font-medium">{tier.label}</span>
            <div className="w-32">
              <label className="label text-xs">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tier.priceCents ? (tier.priceCents / 100).toFixed(2) : ""}
                onChange={(e) => updateCupcakePrice(id, e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-[var(--warm-gray)]">
        Menu card shows the 1-dozen price. Customers choose 1 or 2 dozen when ordering.
      </p>
    </fieldset>
  );
}
