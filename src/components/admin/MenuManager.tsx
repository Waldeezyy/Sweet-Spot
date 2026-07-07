"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string;
  basePriceCents: number;
  isStartingPrice: boolean;
  orderType: string;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
};

type Category = { id: string; name: string };

export function MenuManager({
  categories,
  products: initial,
}: {
  categories: Category[];
  products: Product[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function saveProduct(data: Partial<Product> & { name: string; categoryId: string; basePriceCents: number }) {
    const res = await fetch(editing ? `/api/admin/products/${editing.id}` : "/api/admin/products", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      notify("Your changes are live!");
      setEditing(null);
      setShowForm(false);
      router.refresh();
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p)));
    notify(isActive ? "Item hidden from menu" : "Item is live again!");
  }

  return (
    <div className="mt-8">
      {toast && <div className="mb-4 rounded-xl bg-[var(--sage)]/20 p-3 text-sm text-[var(--chocolate)]">{toast}</div>}
      <button type="button" onClick={() => { setShowForm(true); setEditing(null); }} className="btn-primary">
        + Add New Item
      </button>

      {(showForm || editing) && (
        <ProductForm
          categories={categories}
          initial={editing ?? undefined}
          onSave={saveProduct}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="mt-8 space-y-4">
        {products.map((p) => (
          <div key={p.id} className={`card flex flex-wrap items-center justify-between gap-4 ${!p.isActive ? "opacity-60" : ""}`}>
            <div>
              <p className="text-xs text-[var(--warm-gray)]">{p.categoryName}</p>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-[var(--rose)]">
                {p.isStartingPrice ? "Starting at " : ""}{formatCents(p.basePriceCents)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setEditing(p); setShowForm(false); }} className="btn-secondary text-sm">Edit</button>
              <button type="button" onClick={() => toggleActive(p.id, p.isActive)} className="btn-secondary text-sm">
                {p.isActive ? "Hide from menu" : "Show on menu"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductForm({
  categories,
  initial,
  onSave,
  onCancel,
}: {
  categories: Category[];
  initial?: Product;
  onSave: (data: Partial<Product> & { name: string; categoryId: string; basePriceCents: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? (initial.basePriceCents / 100).toFixed(2) : "");
  const [isStartingPrice, setIsStartingPrice] = useState(initial?.isStartingPrice ?? false);
  const [orderType, setOrderType] = useState(initial?.orderType ?? "STANDARD");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");

  return (
    <form
      className="card mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          name,
          description,
          categoryId,
          basePriceCents: Math.round(parseFloat(price) * 100),
          isStartingPrice,
          orderType,
        });
      }}
    >
      <h3 className="font-semibold">{initial ? "Edit Item" : "Add New Item"}</h3>
      <div>
        <label className="label">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      </div>
      <div>
        <label className="label">Tell customers what&apos;s in this treat</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="input min-h-[100px]" />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label">Price ($)</label>
          <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="input" />
        </div>
        <label className="flex items-center gap-2 pt-8">
          <input type="checkbox" checked={isStartingPrice} onChange={(e) => setIsStartingPrice(e.target.checked)} />
          <span className="text-sm">Starting at price</span>
        </label>
      </div>
      <div>
        <label className="label">Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Order type</label>
        <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="input">
          <option value="STANDARD">Standard item (fixed checkout)</option>
          <option value="SEMI_CUSTOM">Custom item (Brandy reviews price)</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary">Save changes</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
