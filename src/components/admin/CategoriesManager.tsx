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
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

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
    notify(cat.isActive ? "Category hidden" : "Category live!");
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

      <div className="mt-8 space-y-4">
        {initial.map((cat) => (
          <div key={cat.id} className={`card flex flex-wrap items-center justify-between gap-4 ${!cat.isActive ? "opacity-50" : ""}`}>
            <div>
              <p className="font-semibold">{cat.name}</p>
              <p className="text-sm text-[var(--warm-gray)]">
                {FORM_TYPE_LABELS[cat.formType]} · {cat._count.products} items
              </p>
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
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);

  return (
    <form
      className="card mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name, formType, sortOrder });
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
      <div>
        <label className="label">Sort order</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="input max-w-[120px]" />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
