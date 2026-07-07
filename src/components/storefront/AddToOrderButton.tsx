"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderType } from "@prisma/client";
import { useCart } from "@/components/storefront/CartProvider";

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    basePriceCents: number;
    orderType: OrderType;
    allowFlavor: boolean;
    allowTopping: boolean;
    allowFrosting: boolean;
    allowWriting: boolean;
  };
  flavors: string[];
  toppings: string[];
};

export function AddToOrderButton({ product, flavors, toppings }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [flavor, setFlavor] = useState(flavors[0] ?? "");
  const [frosting, setFrosting] = useState("Buttercream");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [writing, setWriting] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  function handleAdd() {
    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      orderType: product.orderType,
      unitPriceCents: product.basePriceCents,
      quantity,
      flavor: product.allowFlavor ? flavor : undefined,
      frosting: product.allowFrosting ? frosting : undefined,
      toppings: product.allowTopping ? selectedToppings : undefined,
      writing: product.allowWriting ? writing : undefined,
      designNotes: product.orderType === "SEMI_CUSTOM" ? designNotes : undefined,
      allergyNotes: allergyNotes || undefined,
    });
    setOpen(false);
    router.push("/order");
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary mt-8 w-full sm:w-auto">
        Add to Order
      </button>
    );
  }

  return (
    <div className="mt-8 space-y-4 border-t border-[var(--blush)] pt-8">
      <h3 className="font-semibold">Customize your order</h3>
      <div>
        <label className="label">Quantity</label>
        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="input max-w-[120px]" />
      </div>
      {product.allowFlavor && (
        <div>
          <label className="label">Flavor</label>
          <select value={flavor} onChange={(e) => setFlavor(e.target.value)} className="input">
            {flavors.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}
      {product.allowFrosting && (
        <div>
          <label className="label">Frosting</label>
          <select value={frosting} onChange={(e) => setFrosting(e.target.value)} className="input">
            <option>Buttercream</option>
            <option>Whipped</option>
          </select>
        </div>
      )}
      {product.allowTopping && (
        <div>
          <label className="label">Toppings (optional)</label>
          <div className="flex flex-wrap gap-2">
            {toppings.map((t) => (
              <label key={t} className="flex items-center gap-1 rounded-full border border-[var(--blush)] px-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedToppings.includes(t)}
                  onChange={(e) =>
                    setSelectedToppings((prev) =>
                      e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)
                    )
                  }
                />
                {t}
              </label>
            ))}
          </div>
        </div>
      )}
      {product.allowWriting && (
        <div>
          <label className="label">Writing on top (optional)</label>
          <input value={writing} onChange={(e) => setWriting(e.target.value)} className="input" placeholder="Happy Birthday!" />
        </div>
      )}
      {product.orderType === "SEMI_CUSTOM" && (
        <div>
          <label className="label">Design / theme description *</label>
          <textarea value={designNotes} onChange={(e) => setDesignNotes(e.target.value)} className="input min-h-[100px]" required placeholder="Describe colors, theme, or inspiration..." />
        </div>
      )}
      <div>
        <label className="label">Allergy or dietary notes (optional)</label>
        <textarea value={allergyNotes} onChange={(e) => setAllergyNotes(e.target.value)} className="input min-h-[80px]" placeholder="Gluten free, nut allergy, etc." />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={handleAdd} className="btn-primary" disabled={product.orderType === "SEMI_CUSTOM" && !designNotes.trim()}>
          Add to Cart
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
