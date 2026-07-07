"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/utils";

type SimpleOption = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  flavorGroup?: string | null;
};

type AddOnOption = SimpleOption & {
  slug: string;
  priceCents: number;
  priceLabel: string;
};

type Tab = "flavors" | "addons" | "treats";

export function MenuOptionsManager({
  flavors: initialFlavors,
  addOns: initialAddOns,
  treatTypes: initialTreats,
}: {
  flavors: SimpleOption[];
  addOns: AddOnOption[];
  treatTypes: SimpleOption[];
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
        <OptionTab
          apiBase="/api/admin/flavors"
          items={initialFlavors}
          onNotify={notify}
          extraFields={(item, save) => (
            <select
              className="input mt-2"
              value={item.flavorGroup ?? ""}
              onChange={(e) => save({ flavorGroup: e.target.value || null })}
            >
              <option value="">All products</option>
              <option value="standard">Standard cupcakes only</option>
              <option value="specialty">Specialty cupcakes only</option>
            </select>
          )}
          renderExtra={(item) =>
            item.flavorGroup ? (
              <span className="text-xs text-[var(--warm-gray)]"> ({item.flavorGroup} cupcakes)</span>
            ) : null
          }
        />
      )}

      {tab === "addons" && (
        <AddOnTab items={initialAddOns} onNotify={notify} />
      )}

      {tab === "treats" && (
        <OptionTab apiBase="/api/admin/treat-types" items={initialTreats} onNotify={notify} />
      )}
    </div>
  );
}

function OptionTab({
  apiBase,
  items,
  onNotify,
  extraFields,
  renderExtra,
}: {
  apiBase: string;
  items: SimpleOption[];
  onNotify: (msg: string) => void;
  extraFields?: (item: SimpleOption, save: (data: Record<string, unknown>) => void) => React.ReactNode;
  renderExtra?: (item: SimpleOption) => React.ReactNode;
}) {
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    onNotify("Added!");
  }

  async function toggle(item: SimpleOption) {
    await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    onNotify(item.isActive ? "Hidden from menu" : "Live again!");
  }

  async function save(item: SimpleOption, data: Record<string, unknown>) {
    await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onNotify("Saved!");
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="New option name" />
        <button type="button" onClick={add} className="btn-primary">Add</button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={`card flex flex-wrap items-center justify-between gap-4 ${!item.isActive ? "opacity-50" : ""}`}>
          <div>
            <p className="font-medium">{item.name}{renderExtra?.(item)}</p>
            {extraFields?.(item, (data) => save(item, data))}
          </div>
          <button type="button" onClick={() => toggle(item)} className="btn-secondary text-sm">
            {item.isActive ? "Hide" : "Show"}
          </button>
        </div>
      ))}
    </div>
  );
}

function AddOnTab({ items, onNotify }: { items: AddOnOption[]; onNotify: (msg: string) => void }) {
  const [form, setForm] = useState({ name: "", price: "", priceLabel: "" });

  async function add() {
    await fetch("/api/admin/add-ons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        priceCents: Math.round(parseFloat(form.price) * 100),
        priceLabel: form.priceLabel,
      }),
    });
    setForm({ name: "", price: "", priceLabel: "" });
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

  return (
    <div className="mt-6 space-y-4">
      <div className="card grid gap-3 sm:grid-cols-3">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Name" />
        <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="Price ($)" type="number" step="0.01" />
        <input value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} className="input" placeholder="Label e.g. +$10" />
        <button type="button" onClick={add} className="btn-primary sm:col-span-3">Add add-on</button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={`card flex flex-wrap items-center justify-between gap-4 ${!item.isActive ? "opacity-50" : ""}`}>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-[var(--warm-gray)]">{formatCents(item.priceCents)} · {item.priceLabel}</p>
          </div>
          <button type="button" onClick={() => toggle(item)} className="btn-secondary text-sm">
            {item.isActive ? "Hide" : "Show"}
          </button>
        </div>
      ))}
    </div>
  );
}
