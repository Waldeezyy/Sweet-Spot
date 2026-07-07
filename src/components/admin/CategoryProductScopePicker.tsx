"use client";

import { useMemo } from "react";
import type { CategoryWithProducts } from "@/lib/menu-option-scope";
import { formatScopeLabel } from "@/lib/menu-option-scope";

export type MenuOptionScope = {
  categorySlugs: string[];
  productSlugs: string[];
};

type Props = {
  categories: CategoryWithProducts[];
  value: MenuOptionScope;
  onChange: (scope: MenuOptionScope) => void;
  compact?: boolean;
};

export function CategoryProductScopePicker({ categories, value, onChange, compact }: Props) {
  const summary = useMemo(() => formatScopeLabel(value, categories), [value, categories]);

  function toggleCategory(slug: string) {
    const next = value.categorySlugs.includes(slug)
      ? value.categorySlugs.filter((s) => s !== slug)
      : [...value.categorySlugs, slug];
    onChange({ categorySlugs: next, productSlugs: [] });
  }

  function toggleProduct(slug: string) {
    const next = value.productSlugs.includes(slug)
      ? value.productSlugs.filter((s) => s !== slug)
      : [...value.productSlugs, slug];
    onChange({ categorySlugs: [], productSlugs: next });
  }

  function selectAll() {
    onChange({ categorySlugs: [], productSlugs: [] });
  }

  const usingProducts = value.productSlugs.length > 0;

  return (
    <div className={compact ? "mt-2" : "mt-3 rounded-xl border border-[var(--blush)] bg-[var(--cream)]/40 p-3"}>
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Where does this show?</p>
          <button type="button" onClick={selectAll} className="text-xs text-[var(--rose)] hover:underline">
            Reset to all items
          </button>
        </div>
      )}
      <p className={`text-xs text-[var(--warm-gray)] ${compact ? "" : "mt-1"}`}>
        {summary}
        {!compact && " — pick whole categories, or expand a category to limit to specific products."}
      </p>

      <div className={`space-y-3 ${compact ? "mt-2" : "mt-3"}`}>
        {categories.map((category) => {
          const categoryChecked = !usingProducts && value.categorySlugs.includes(category.slug);
          const categoryIndeterminate =
            usingProducts && category.products.some((p) => value.productSlugs.includes(p.slug));

          return (
            <div key={category.slug} className="rounded-lg border border-[var(--blush)]/70 bg-white/60 p-3">
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={categoryChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = categoryIndeterminate;
                  }}
                  onChange={() => toggleCategory(category.slug)}
                />
                {category.name}
              </label>

              {category.products.length > 0 && (
                <div className="mt-2 space-y-1 pl-6">
                  {category.products.map((product) => (
                    <label key={product.slug} className="flex items-center gap-2 text-sm text-[var(--warm-gray)]">
                      <input
                        type="checkbox"
                        checked={value.productSlugs.includes(product.slug)}
                        onChange={() => toggleProduct(product.slug)}
                      />
                      {product.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
