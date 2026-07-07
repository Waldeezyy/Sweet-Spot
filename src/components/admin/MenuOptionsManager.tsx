"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/utils";
import { formatScopeLabel } from "@/lib/menu-option-scope";
import type { CategoryWithProducts } from "@/lib/menu-option-scope";
import {
  CategoryProductScopePicker,
  type MenuOptionScope,
} from "@/components/admin/CategoryProductScopePicker";

type ScopedOption = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  categorySlugs: string[];
  productSlugs: string[];
};

type AddOnOption = ScopedOption & {
  slug: string;
  priceCents: number;
  priceLabel: string;
};

type Tab = "flavors" | "addons" | "treats";

const EMPTY_SCOPE: MenuOptionScope = { categorySlugs: [], productSlugs: [] };

export function MenuOptionsManager({
  categories,
  flavors: initialFlavors,
  addOns: initialAddOns,
  treatTypes: initialTreats,
}: {
  categories: CategoryWithProducts[];
  flavors: ScopedOption[];
  addOns: AddOnOption[];
  treatTypes: ScopedOption[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("flavors");
  const [toast, setToast] = useState("");

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
    router.refresh();
  }

  return (
    <div className="mt-8">
      {toast && <div className="mb-4 rounded-xl bg-[var(--sage)]/20 p-3 text-sm">{toast}</div>}
      <div className="flex flex-wrap gap-2">
        {([
          ["flavors", "Flavors & fillings"],
          ["addons", "Add-ons"],
          ["treats", "Party treat types"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === id ? "bg-[var(--chocolate)] text-white" : "bg-[var(--blush)]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "flavors" && (
        <ScopedOptionTab
          apiBase="/api/admin/flavors"
          items={initialFlavors}
          categories={categories}
          onNotify={notify}
          namePlaceholder="New flavor or filling"
        />
      )}

      {tab === "addons" && (
        <AddOnTab items={initialAddOns} categories={categories} onNotify={notify} />
      )}

      {tab === "treats" && (
        <ScopedOptionTab
          apiBase="/api/admin/treat-types"
          items={initialTreats}
          categories={categories}
          onNotify={notify}
          namePlaceholder="New party treat type"
        />
      )}
    </div>
  );
}

function ScopedOptionTab({
  apiBase,
  items,
  categories,
  onNotify,
  namePlaceholder,
}: {
  apiBase: string;
  items: ScopedOption[];
  categories: CategoryWithProducts[];
  onNotify: (msg: string) => void;
  namePlaceholder: string;
}) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<MenuOptionScope>(EMPTY_SCOPE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return;
    await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), ...scope }),
    });
    setName("");
    setScope(EMPTY_SCOPE);
    onNotify("Added!");
  }

  async function toggle(item: ScopedOption) {
    await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    onNotify(item.isActive ? "Hidden from menu" : "Live again!");
  }

  async function saveScope(item: ScopedOption, nextScope: MenuOptionScope) {
    await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextScope),
    });
    onNotify("Scope saved!");
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="card space-y-3">
        <p className="font-medium">Add new option</p>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder={namePlaceholder} />
        <CategoryProductScopePicker categories={categories} value={scope} onChange={setScope} />
        <button type="button" onClick={add} className="btn-primary">Add</button>
      </div>

      {items.map((item) => (
        <div key={item.id} className={`card space-y-3 ${!item.isActive ? "opacity-50" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-xs text-[var(--warm-gray)]">
                Shows on: {formatScopeLabel(item, categories)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="btn-secondary text-sm"
              >
                {expandedId === item.id ? "Hide scope" : "Edit scope"}
              </button>
              <button type="button" onClick={() => toggle(item)} className="btn-secondary text-sm">
                {item.isActive ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {expandedId === item.id && (
            <CategoryProductScopePicker
              categories={categories}
              value={{ categorySlugs: item.categorySlugs, productSlugs: item.productSlugs }}
              onChange={(next) => saveScope(item, next)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function AddOnTab({
  items,
  categories,
  onNotify,
}: {
  items: AddOnOption[];
  categories: CategoryWithProducts[];
  onNotify: (msg: string) => void;
}) {
  const [form, setForm] = useState({ name: "", price: "", priceLabel: "" });
  const [scope, setScope] = useState<MenuOptionScope>(EMPTY_SCOPE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function add() {
    await fetch("/api/admin/add-ons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        priceCents: Math.round(parseFloat(form.price) * 100),
        priceLabel: form.priceLabel,
        ...scope,
      }),
    });
    setForm({ name: "", price: "", priceLabel: "" });
    setScope(EMPTY_SCOPE);
    onNotify("Add-on created!");
  }

  async function toggle(item: AddOnOption) {
    await fetch(`/api/admin/add-ons/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    onNotify(item.isActive ? "Hidden" : "Live!");
  }

  async function saveScope(item: AddOnOption, nextScope: MenuOptionScope) {
    await fetch(`/api/admin/add-ons/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextScope),
    });
    onNotify("Scope saved!");
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="card space-y-3">
        <p className="font-medium">Add new add-on</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Name" />
          <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="Price ($)" type="number" step="0.01" />
          <input value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} className="input" placeholder="Label e.g. +$10" />
        </div>
        <CategoryProductScopePicker categories={categories} value={scope} onChange={setScope} />
        <button type="button" onClick={add} className="btn-primary">Add add-on</button>
      </div>

      {items.map((item) => (
        <div key={item.id} className={`card space-y-3 ${!item.isActive ? "opacity-50" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-[var(--warm-gray)]">{formatCents(item.priceCents)} · {item.priceLabel}</p>
              <p className="mt-1 text-xs text-[var(--warm-gray)]">
                Shows on: {formatScopeLabel(item, categories)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="btn-secondary text-sm"
              >
                {expandedId === item.id ? "Hide scope" : "Edit scope"}
              </button>
              <button type="button" onClick={() => toggle(item)} className="btn-secondary text-sm">
                {item.isActive ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {expandedId === item.id && (
            <CategoryProductScopePicker
              categories={categories}
              value={{ categorySlugs: item.categorySlugs, productSlugs: item.productSlugs }}
              onChange={(next) => saveScope(item, next)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
