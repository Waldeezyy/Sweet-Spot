"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CategoryFormType } from "@prisma/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  formType: CategoryFormType;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
};

const FORM_TYPE_LABELS: Record<CategoryFormType, string> = {
  SIMPLE: "Simple (flavor, frosting, toppings)",
  CUPCAKE: "Cupcake (dozen pricing)",
  ROUND_CAKE: "Round cake (size tiers)",
  SHEET_CAKE: "Sheet cake",
  PARTY_PACKAGE: "Party package",
};

export function CategoriesManager({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reordering, setReordering] = useState(false);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
    router.refresh();
  }

  async function save(data: Partial<Category> & { name: string }) {
    const res = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      notify("Category saved!");
      setEditing(null);
      setShowForm(false);
    }
  }

  async function toggleActive(cat: Category) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
    );
    notify(cat.isActive ? "Category hidden" : "Category live!");
  }

  async function persistOrder(next: Category[]) {
    setReordering(true);
    const res = await fetch("/api/admin/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((c) => c.id) }),
    });
    setReordering(false);
    if (res.ok) {
      setCategories(next.map((c, index) => ({ ...c, sortOrder: index })));
      notify("Menu order updated!");
    }
  }

  function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  }

  return (
    <div className="mt-8">
      {toast && <div className="mb-4 rounded-xl bg-[var(--sage)]/20 p-3 text-sm">{toast}</div>}
      <button type="button" onClick={() => { setShowForm(true); setEditing(null); }} className="btn-primary">
        + Add category
      </button>

      {(showForm || editing) && (
        <CategoryForm
          initial={editing ?? undefined}
          onSave={save}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <p className="mt-6 text-sm text-[var(--warm-gray)]">
        Use the arrows to change the order categories appear on your menu page.
      </p>

      <div className="mt-4 space-y-4">
        {categories.map((cat, index) => (
          <div key={cat.id} className={`card flex flex-wrap items-center justify-between gap-4 ${!cat.isActive ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveCategory(index, -1)}
                  disabled={index === 0 || reordering}
                  className="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                  aria-label={`Move ${cat.name} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCategory(index, 1)}
                  disabled={index === categories.length - 1 || reordering}
                  className="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                  aria-label={`Move ${cat.name} down`}
                >
                  ↓
                </button>
              </div>
              <div>
                <p className="font-semibold">{cat.name}</p>
                <p className="text-sm text-[var(--warm-gray)]">
                  {FORM_TYPE_LABELS[cat.formType]} · {cat._count.products} items
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditing(cat); setShowForm(false); }} className="btn-secondary text-sm">Edit</button>
              <button type="button" onClick={() => toggleActive(cat)} className="btn-secondary text-sm">
                {cat.isActive ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Category;
  onSave: (data: Partial<Category> & { name: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [formType, setFormType] = useState<CategoryFormType>(initial?.formType ?? "SIMPLE");

  return (
    <form
      className="card mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name, formType });
      }}
    >
      <h3 className="font-semibold">{initial ? "Edit category" : "New category"}</h3>
      <div>
        <label className="label">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      </div>
      <div>
        <label className="label">How customers order items in this category</label>
        <select value={formType} onChange={(e) => setFormType(e.target.value as CategoryFormType)} className="input">
          {Object.entries(FORM_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
