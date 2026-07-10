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
  categoryFormType: string;
  imageUrl: string | null;
  sortOrder: number;
  allowFlavor: boolean;
  allowTopping: boolean;
  allowFrosting: boolean;
  allowWriting: boolean;
  maxFlavorOptions: number;
  piecesPerOrderUnit: number;
};

type Category = { id: string; name: string; formType: string };

export function MenuManager({
  categories,
  products: initial,
}: {
  categories: Category[];
  products: Product[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState("");

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function closeForm() {
    setEditingId(null);
    setShowAddForm(false);
  }

  async function saveProduct(id: string | null, data: Record<string, unknown>) {
    const res = await fetch(id ? `/api/admin/products/${id}` : "/api/admin/products", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      notify("Your changes are live!");
      closeForm();
      router.refresh();
    }
  }

  async function deleteProduct(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (!window.confirm(`Permanently delete "${product.name}" from the menu? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      notify("Item deleted from menu.");
      closeForm();
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
      <button
        type="button"
        onClick={() => { setShowAddForm(true); setEditingId(null); }}
        className="btn-primary"
      >
        + Add New Item
      </button>

      {showAddForm && (
        <ProductForm
          key="new"
          categories={categories}
          onSave={(data) => saveProduct(null, data)}
          onCancel={closeForm}
        />
      )}

      <div className="mt-8 space-y-4">
        {products.map((p) => (
          <div key={p.id}>
            <div
              className={`card flex flex-wrap items-center justify-between gap-4 ${
                !p.isActive ? "opacity-60" : ""
              } ${editingId === p.id ? "border-2 border-[var(--chocolate)]" : ""}`}
            >
              <div className="flex gap-4">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div>
                  <p className="text-xs text-[var(--warm-gray)]">{p.categoryName}</p>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-[var(--rose)]">
                    {p.isStartingPrice ? "Starting at " : ""}{formatCents(p.basePriceCents)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingId(p.id); setShowAddForm(false); }}
                  className="btn-secondary text-sm"
                >
                  {editingId === p.id ? "Editing…" : "Edit"}
                </button>
                <button type="button" onClick={() => toggleActive(p.id, p.isActive)} className="btn-secondary text-sm">
                  {p.isActive ? "Hide from menu" : "Show on menu"}
                </button>
              </div>
            </div>

            {editingId === p.id && (
              <ProductForm
                key={p.id}
                categories={categories}
                initial={p}
                onSave={(data) => saveProduct(p.id, data)}
                onCancel={closeForm}
                onDelete={() => deleteProduct(p.id)}
              />
            )}
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
  onDelete,
}: {
  categories: Category[];
  initial?: Product;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? (initial.basePriceCents / 100).toFixed(2) : "");
  const [isStartingPrice, setIsStartingPrice] = useState(initial?.isStartingPrice ?? false);
  const [orderType, setOrderType] = useState(initial?.orderType ?? "STANDARD");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [allowFlavor, setAllowFlavor] = useState(initial?.allowFlavor ?? true);
  const [allowTopping, setAllowTopping] = useState(initial?.allowTopping ?? true);
  const [allowFrosting, setAllowFrosting] = useState(initial?.allowFrosting ?? true);
  const [allowWriting, setAllowWriting] = useState(initial?.allowWriting ?? true);
  const [maxFlavorOptions, setMaxFlavorOptions] = useState(initial?.maxFlavorOptions ?? 1);
  const [piecesPerOrderUnit, setPiecesPerOrderUnit] = useState(initial?.piecesPerOrderUnit ?? 1);
  const [uploading, setUploading] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const showMaxFlavorOptions = selectedCategory?.formType !== "PARTY_PACKAGE";
  const showPiecesPerOrderUnit = showMaxFlavorOptions && maxFlavorOptions > 1;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (data.url) setImageUrl(data.url);
    setUploading(false);
  }

  return (
    <form
      className="card mt-2 space-y-4 border-2 border-[var(--chocolate)]/30"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          name,
          description,
          categoryId,
          basePriceCents: Math.round(parseFloat(price) * 100),
          isStartingPrice,
          orderType,
          imageUrl: imageUrl || null,
          sortOrder,
          allowFlavor,
          allowTopping,
          allowFrosting,
          allowWriting,
          maxFlavorOptions: showMaxFlavorOptions ? maxFlavorOptions : 1,
          piecesPerOrderUnit: showMaxFlavorOptions && maxFlavorOptions > 1 ? piecesPerOrderUnit : 1,
        });
      }}
    >
      <h3 className="font-semibold">{initial ? `Edit: ${initial.name}` : "Add New Item"}</h3>
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
      <div>
        <label className="label">Sort order (lower shows first)</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="input max-w-[120px]" />
      </div>
      <div>
        <label className="label">Photo</label>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="mb-2 h-24 w-24 rounded-lg object-cover" />
        )}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
        {uploading && <p className="text-xs text-[var(--warm-gray)]">Uploading...</p>}
      </div>
      <fieldset className="space-y-2">
        <legend className="label">What can customers customize? (for simple category items)</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allowFlavor} onChange={(e) => setAllowFlavor(e.target.checked)} /> Flavor
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allowFrosting} onChange={(e) => setAllowFrosting(e.target.checked)} /> Frosting
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allowTopping} onChange={(e) => setAllowTopping(e.target.checked)} /> Toppings
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allowWriting} onChange={(e) => setAllowWriting(e.target.checked)} /> Writing on top
        </label>
      </fieldset>

      {showMaxFlavorOptions && (
        <div>
          <label className="label">Maximum flavor combinations</label>
          <input
            type="number"
            min={1}
            max={6}
            value={maxFlavorOptions}
            onChange={(e) => setMaxFlavorOptions(Math.max(1, Number(e.target.value) || 1))}
            className="input max-w-[120px]"
          />
          <p className="mt-1 text-xs text-[var(--warm-gray)]">
            Maximum flavor combinations <strong>per</strong> order unit (see pieces field below). If you set 2 combinations and 12 pieces, a customer ordering two units (e.g. 2 dozen cupcakes or quantity 2) can split into up to <strong>4</strong> combinations. Leave at <strong>1</strong> for single-flavor orders.
          </p>
        </div>
      )}

      {showPiecesPerOrderUnit && (
        <div className="rounded-xl border border-[var(--blush)] bg-[var(--cream)]/50 p-4 space-y-2">
          <label className="label">How many pieces are in one order?</label>
          <input
            type="number"
            min={1}
            value={piecesPerOrderUnit}
            onChange={(e) => setPiecesPerOrderUnit(Math.max(1, Number(e.target.value) || 1))}
            className="input max-w-[120px]"
            required
          />
          <p className="text-xs text-[var(--warm-gray)]">
            How many individual treats count as one order unit for splitting — e.g. <strong>12</strong> for a dozen. Free number; no presets.
          </p>
        </div>
      )}

      <p className="text-xs text-[var(--warm-gray)]">
        Cupcake, round cake, sheet cake, and party categories use their own order forms. Size/dozen pricing follows your flyer tiers.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">Save changes</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn-secondary text-red-600">
            Delete from menu
          </button>
        )}
      </div>
    </form>
  );
}
