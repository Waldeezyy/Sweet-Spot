"use client";

import { useEffect, useState } from "react";
import type { OrderPortion } from "@/lib/order-portions";
import {
  canSplitEvenly,
  getFlavorGroupLabel,
  getOrderUnits,
  getPortionSize,
  getSplitSummary,
  getTotalSplittableUnits,
  getTreatDisplayName,
  splitCountError,
  validatePortions,
} from "@/lib/order-portions";
import type { CategoryFormType } from "@prisma/client";

export type PortionCustomizationConfig = {
  allowFlavor: boolean;
  allowFrosting: boolean;
  allowTopping: boolean;
  allowWriting: boolean;
  flavors: string[];
  frostings: string[];
  toppings: string[];
  addOns?: { slug: string; name: string; priceLabel: string }[];
};

type Props = {
  maxSplitCombinations: number;
  categorySlug?: string;
  splittableContext: {
    formType?: CategoryFormType | string;
    dozenCount?: number;
    quantity?: number;
    piecesPerOrderUnit?: number;
  };
  config: PortionCustomizationConfig;
  onSingleChange: (data: {
    flavor?: string;
    frosting?: string;
    toppings?: string[];
    addOns?: string[];
    writing?: string;
  }) => void;
  onPortionsChange: (portions: OrderPortion[] | null) => void;
  singleValues: {
    flavor?: string;
    frosting?: string;
    toppings?: string[];
    addOns?: string[];
    writing?: string;
  };
  portions: OrderPortion[] | null;
};

function emptyPortion(count: number): OrderPortion {
  return { count, flavor: "", frosting: "", toppings: [], addOns: [], writing: "" };
}

export function SplitPortionCustomizer({
  maxSplitCombinations,
  categorySlug,
  splittableContext,
  config,
  onSingleChange,
  onPortionsChange,
  singleValues,
  portions,
}: Props) {
  const orderUnits = getOrderUnits(splittableContext);
  const totalUnits = getTotalSplittableUnits(splittableContext);
  const treats = getTreatDisplayName(categorySlug);
  const [splitMode, setSplitMode] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  const portionSize = getPortionSize(totalUnits, splitCount);
  const splitError = splitMode ? splitCountError(totalUnits, splitCount) : null;

  useEffect(() => {
    setSplitMode(false);
    setSplitCount(2);
  }, [orderUnits, splittableContext.piecesPerOrderUnit, maxSplitCombinations]);

  function handleModeChange(useSplit: boolean) {
    setSplitMode(useSplit);
    if (!useSplit) {
      onPortionsChange(null);
    } else if (portionSize) {
      onPortionsChange(
        Array.from({ length: splitCount }, () =>
          emptyPortion(portionSize)
        )
      );
    }
  }

  function handleSplitCountChange(count: number) {
    setSplitCount(count);
    const size = getPortionSize(totalUnits, count);
    if (size && splitMode) {
      onPortionsChange(Array.from({ length: count }, () => emptyPortion(size)));
    }
  }

  function updatePortion(index: number, updates: Partial<OrderPortion>) {
    if (!portions) return;
    const next = portions.map((p, i) => (i === index ? { ...p, ...updates } : p));
    onPortionsChange(next);
  }

  function togglePortionTopping(index: number, name: string, field: "toppings" | "addOns") {
    if (!portions) return;
    const current = portions[index][field] ?? [];
    const next = current.includes(name)
      ? current.filter((t) => t !== name)
      : [...current, name];
    updatePortion(index, { [field]: next });
  }

  if (maxSplitCombinations <= 1) {
    return (
      <SingleCustomizationFields
        config={config}
        values={singleValues}
        onChange={onSingleChange}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="label">Want one flavor or a mix?</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm ${!splitMode ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"}`}>
            <input
              type="radio"
              checked={!splitMode}
              onChange={() => handleModeChange(false)}
            />
            Same flavor for all {totalUnits} {treats}
          </label>
          <label className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border-2 px-4 py-2 text-sm ${splitMode ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"}`}>
            <span className="flex items-center gap-2">
              <input
                type="radio"
                checked={splitMode}
                onChange={() => handleModeChange(true)}
                disabled={totalUnits < 2}
              />
              Mix flavors
            </span>
            <span className="pl-6 text-xs text-[var(--warm-gray)]">like half chocolate, half vanilla</span>
          </label>
        </div>
      </div>

      {!splitMode ? (
        <SingleCustomizationFields
          config={config}
          values={singleValues}
          onChange={onSingleChange}
        />
      ) : (
        <>
          <div>
            <label className="label">How many different flavors?</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: maxSplitCombinations - 1 }, (_, i) => i + 2).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={!canSplitEvenly(totalUnits, n)}
                  onClick={() => handleSplitCountChange(n)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-medium disabled:opacity-40 ${
                    splitCount === n ? "border-[var(--chocolate)] bg-[var(--blush)]/30" : "border-[var(--blush)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {splitError && <p className="mt-2 text-sm text-red-600">{splitError}</p>}
            {portionSize && !splitError && (
              <p className="mt-2 text-sm text-[var(--warm-gray)]">
                {getSplitSummary(splitCount, portionSize, categorySlug)}
              </p>
            )}
          </div>

          {portions?.map((portion, index) => (
            <div key={index} className="rounded-xl border border-[var(--blush)] bg-[var(--cream)]/50 p-4 space-y-3">
              <p className="font-medium text-sm">
                {getFlavorGroupLabel(index, portion.count, categorySlug)}
              </p>
              {config.allowFlavor && config.flavors.length > 0 && (
                <div>
                  <label className="label">Flavor</label>
                  <select
                    value={portion.flavor ?? ""}
                    onChange={(e) => updatePortion(index, { flavor: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select...</option>
                    {config.flavors.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              )}
              {config.allowFrosting && config.frostings.length > 0 && (
                <div>
                  <label className="label">Frosting</label>
                  <select
                    value={portion.frosting ?? ""}
                    onChange={(e) => updatePortion(index, { frosting: e.target.value })}
                    className="input"
                  >
                    {config.frostings.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              )}
              {config.allowTopping && config.toppings.length > 0 && (
                <div>
                  <label className="label">Toppings (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {config.toppings.map((t) => (
                      <label key={t} className="flex items-center gap-1 rounded-full border border-[var(--blush)] px-3 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={(portion.toppings ?? []).includes(t)}
                          onChange={() => togglePortionTopping(index, t, "toppings")}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {config.addOns && config.addOns.length > 0 && (
                <div>
                  <label className="label">Add-ons (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {config.addOns.map((a) => (
                      <label key={a.slug} className="flex items-center gap-1 rounded-full border border-[var(--blush)] px-3 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={(portion.addOns ?? []).includes(a.name)}
                          onChange={() => togglePortionTopping(index, a.name, "addOns")}
                        />
                        {a.name} ({a.priceLabel})
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {config.allowWriting && (
                <div>
                  <label className="label">Writing (optional)</label>
                  <input
                    value={portion.writing ?? ""}
                    onChange={(e) => updatePortion(index, { writing: e.target.value })}
                    className="input"
                  />
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function SingleCustomizationFields({
  config,
  values,
  onChange,
}: {
  config: PortionCustomizationConfig;
  values: Props["singleValues"];
  onChange: Props["onSingleChange"];
}) {
  function toggleTopping(name: string) {
    const current = values.toppings ?? [];
    onChange({
      toppings: current.includes(name) ? current.filter((t) => t !== name) : [...current, name],
    });
  }

  function toggleAddOn(name: string) {
    const current = values.addOns ?? [];
    onChange({
      addOns: current.includes(name) ? current.filter((t) => t !== name) : [...current, name],
    });
  }

  return (
    <div className="space-y-4">
      {config.allowFlavor && config.flavors.length > 0 && (
        <div>
          <label className="label">Flavor</label>
          <select
            value={values.flavor ?? ""}
            onChange={(e) => onChange({ flavor: e.target.value })}
            className="input"
          >
            {config.flavors.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      )}
      {config.allowFrosting && config.frostings.length > 0 && (
        <div>
          <label className="label">Frosting</label>
          <select
            value={values.frosting ?? config.frostings[0]}
            onChange={(e) => onChange({ frosting: e.target.value })}
            className="input"
          >
            {config.frostings.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      )}
      {config.allowTopping && config.toppings.length > 0 && (
        <div>
          <label className="label">Toppings (optional)</label>
          <div className="flex flex-wrap gap-2">
            {config.toppings.map((t) => (
              <label key={t} className="flex items-center gap-1 rounded-full border border-[var(--blush)] px-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={(values.toppings ?? []).includes(t)}
                  onChange={() => toggleTopping(t)}
                />
                {t}
              </label>
            ))}
          </div>
        </div>
      )}
      {config.addOns && config.addOns.length > 0 && (
        <div>
          <label className="label">Add-ons (optional)</label>
          <div className="flex flex-wrap gap-2">
            {config.addOns.map((a) => (
              <label key={a.slug} className="flex items-center gap-1 rounded-full border border-[var(--blush)] px-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={(values.addOns ?? []).includes(a.name)}
                  onChange={() => toggleAddOn(a.name)}
                />
                {a.name} ({a.priceLabel})
              </label>
            ))}
          </div>
        </div>
      )}
      {config.allowWriting && (
        <div>
          <label className="label">Writing on top (optional)</label>
          <input
            value={values.writing ?? ""}
            onChange={(e) => onChange({ writing: e.target.value })}
            className="input"
          />
        </div>
      )}
    </div>
  );
}

export function validateSplitSubmission(
  maxSplitCombinations: number,
  splittableContext: Props["splittableContext"],
  config: PortionCustomizationConfig,
  singleValues: Props["singleValues"],
  portions: OrderPortion[] | null,
  splitMode: boolean,
  categorySlug?: string
): string | null {
  const totalUnits = getTotalSplittableUnits(splittableContext);
  if (maxSplitCombinations <= 1 || !splitMode || !portions) {
    if (config.allowFlavor && !singleValues.flavor?.trim()) {
      return "Please pick a flavor.";
    }
    return null;
  }
  return validatePortions(portions, totalUnits, {
    requireFlavor: config.allowFlavor && config.flavors.length > 0,
    requireFrosting: false,
    categorySlug,
  });
}
