"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderType, CategoryFormType } from "@prisma/client";
import { useCart } from "@/components/storefront/CartProvider";
import { formatPartySelections, getPartyPackageConfig } from "@/lib/party-packages";
import type { MenuAddOn } from "@/lib/menu-options";
import { formatAddOnNamesFromList } from "@/lib/menu-options";
import { PartyPackageForm } from "@/components/storefront/PartyPackageForm";
import { CupcakeForm } from "@/components/storefront/CupcakeForm";
import { RoundCakeForm } from "@/components/storefront/RoundCakeForm";
import { SheetCakeForm } from "@/components/storefront/SheetCakeForm";
import { SplitPortionCustomizer } from "@/components/storefront/SplitPortionCustomizer";
import type { OrderPortion } from "@/lib/order-portions";
import {
  getMaxSplitCombinations,
  getOrderUnits,
  getQuantityLabel,
  normalizePortionsToLegacyFields,
} from "@/lib/order-portions";

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
    maxFlavorOptions: number;
    piecesPerOrderUnit: number;
  };
  categorySlug: string;
  categoryFormType: CategoryFormType;
  flavors: string[];
  toppings: string[];
  addOnOptions: MenuAddOn[];
  treatTypes: string[];
};

export function AddToOrderButton({
  product,
  categorySlug,
  categoryFormType,
  flavors,
  toppings,
  addOnOptions,
  treatTypes,
}: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);

  const partyMode = categoryFormType === "PARTY_PACKAGE";
  const partyConfig = partyMode ? getPartyPackageConfig(product.slug) : null;
  const cupcakeMode = categoryFormType === "CUPCAKE";
  const roundCakeMode = categoryFormType === "ROUND_CAKE";
  const sheetCakeMode = categoryFormType === "SHEET_CAKE";

  function handleAddParty(data: {
    treatTypes: string[];
    themeColors: string;
    designNotes: string;
    allergyNotes: string;
    quantity: number;
  }) {
    const mapped = formatPartySelections(data);
    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      categorySlug,
      orderType: product.orderType,
      unitPriceCents: product.basePriceCents,
      quantity: data.quantity,
      treatTypes: data.treatTypes,
      themeColors: data.themeColors,
      flavor: mapped.flavor,
      frosting: mapped.frosting,
      designNotes: mapped.designNotes,
      allergyNotes: data.allergyNotes || undefined,
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

  if (partyMode && partyConfig) {
    const config =
      product.slug === "your-party-package"
        ? { ...partyConfig, maxTreatTypes: treatTypes.length }
        : partyConfig;
    return (
      <PartyPackageForm
        productName={product.name}
        orderType={product.orderType}
        config={config}
        treatTypes={treatTypes}
        onSubmit={handleAddParty}
        onCancel={() => setOpen(false)}
      />
    );
  }

  if (cupcakeMode) {
    return (
      <CupcakeForm
        productSlug={product.slug}
        productName={product.name}
        orderType={product.orderType}
        basePriceCents={product.basePriceCents}
        maxFlavorOptions={product.maxFlavorOptions}
        piecesPerOrderUnit={product.piecesPerOrderUnit}
        flavors={flavors}
        onSubmit={(data) => {
          addItem({
            id: crypto.randomUUID(),
            productId: product.id,
            productName: data.displayName,
            productSlug: product.slug,
            categorySlug,
            orderType: product.orderType,
            unitPriceCents: data.unitPriceCents,
            quantity: 1,
            flavor: data.flavor,
            frosting: data.frosting,
            dozenCount: data.dozenCount,
            designNotes: data.designNotes || undefined,
            allergyNotes: data.allergyNotes || undefined,
            portions: data.portions,
          });
          setOpen(false);
          router.push("/order");
        }}
        onCancel={() => setOpen(false)}
      />
    );
  }

  if (roundCakeMode) {
    return (
      <RoundCakeForm
        productSlug={product.slug}
        productName={product.name}
        basePriceCents={product.basePriceCents}
        flavors={flavors}
        addOnOptions={addOnOptions}
        onSubmit={(data) => {
          const addOnNames = formatAddOnNamesFromList(data.addOns, addOnOptions);
          addItem({
            id: crypto.randomUUID(),
            productId: product.id,
            productName: data.displayName,
            productSlug: product.slug,
            categorySlug,
            orderType: product.orderType,
            unitPriceCents: data.unitPriceCents,
            quantity: 1,
            flavor: data.flavor,
            frosting: data.frosting,
            cakeSize: data.cakeSize,
            toppings: addOnNames,
            addOns: addOnNames,
            writing: data.writing || undefined,
            designNotes: data.designNotes || undefined,
            allergyNotes: data.allergyNotes || undefined,
          });
          setOpen(false);
          router.push("/order");
        }}
        onCancel={() => setOpen(false)}
      />
    );
  }

  if (sheetCakeMode) {
    return (
      <SheetCakeForm
        productSlug={product.slug}
        productName={product.name}
        basePriceCents={product.basePriceCents}
        flavors={flavors}
        addOnOptions={addOnOptions}
        onSubmit={(data) => {
          const addOnNames = formatAddOnNamesFromList(data.addOns, addOnOptions);
          addItem({
            id: crypto.randomUUID(),
            productId: product.id,
            productName: data.displayName,
            productSlug: product.slug,
            categorySlug,
            orderType: product.orderType,
            unitPriceCents: data.unitPriceCents,
            quantity: 1,
            flavor: data.flavor,
            frosting: data.frosting,
            toppings: addOnNames,
            addOns: addOnNames,
            writing: data.writing || undefined,
            designNotes: data.designNotes || undefined,
            allergyNotes: data.allergyNotes || undefined,
          });
          setOpen(false);
          router.push("/order");
        }}
        onCancel={() => setOpen(false)}
      />
    );
  }

  return (
    <LegacyCakeForm
      product={product}
      categorySlug={categorySlug}
      flavors={flavors}
      toppings={toppings}
      onCancel={() => setOpen(false)}
    />
  );
}

function LegacyCakeForm({
  product,
  categorySlug,
  flavors,
  toppings,
  onCancel,
}: {
  product: Props["product"];
  categorySlug: string;
  flavors: string[];
  toppings: string[];
  onCancel: () => void;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [singleFlavor, setSingleFlavor] = useState(flavors[0] ?? "");
  const [singleFrosting, setSingleFrosting] = useState("Buttercream");
  const [singleToppings, setSingleToppings] = useState<string[]>([]);
  const [singleWriting, setSingleWriting] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [portions, setPortions] = useState<OrderPortion[] | null>(null);
  const [error, setError] = useState("");

  const frostings = ["Buttercream", "Whipped"];
  const maxSplitCombinations = getMaxSplitCombinations(
    product.maxFlavorOptions,
    getOrderUnits({ formType: "SIMPLE", quantity })
  );

  function handleAddCake() {
    if (product.orderType === "SEMI_CUSTOM" && !designNotes.trim()) {
      setError("Please describe your design or theme.");
      return;
    }

    if (portions && portions.length > 0) {
      for (const p of portions) {
        if (product.allowFlavor && !p.flavor?.trim()) {
          setError("Please choose a flavor for each combination.");
          return;
        }
      }
      const legacy = normalizePortionsToLegacyFields(portions);
      addItem({
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        categorySlug,
        orderType: product.orderType,
        unitPriceCents: product.basePriceCents,
        quantity,
        flavor: legacy.flavor,
        frosting: legacy.frosting,
        toppings: legacy.toppings?.split(", "),
        writing: legacy.writing,
        designNotes: product.orderType === "SEMI_CUSTOM" ? designNotes : undefined,
        allergyNotes: allergyNotes || undefined,
        portions,
      });
      onCancel();
      router.push("/order");
      return;
    }

    if (product.allowFlavor && !singleFlavor.trim()) {
      setError("Please choose a flavor.");
      return;
    }

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      categorySlug,
      orderType: product.orderType,
      unitPriceCents: product.basePriceCents,
      quantity,
      flavor: product.allowFlavor ? singleFlavor : undefined,
      frosting: product.allowFrosting ? singleFrosting : undefined,
      toppings: product.allowTopping ? singleToppings : undefined,
      writing: product.allowWriting ? singleWriting : undefined,
      designNotes: product.orderType === "SEMI_CUSTOM" ? designNotes : undefined,
      allergyNotes: allergyNotes || undefined,
    });
    onCancel();
    router.push("/order");
  }

  return (
    <div className="mt-8 space-y-4 border-t border-[var(--blush)] pt-8">
      <h3 className="font-semibold">Customize your order</h3>
      <div>
        <label className="label">{getQuantityLabel(product.piecesPerOrderUnit)}</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => {
            setQuantity(Number(e.target.value));
            setPortions(null);
          }}
          className="input max-w-[120px]"
        />
        {product.piecesPerOrderUnit > 1 && (
          <p className="mt-1 text-xs text-[var(--warm-gray)]">
            Each order = {product.piecesPerOrderUnit} pieces ({quantity * product.piecesPerOrderUnit} total)
          </p>
        )}
      </div>

      <SplitPortionCustomizer
        maxSplitCombinations={maxSplitCombinations}
        splittableContext={{
          formType: "SIMPLE",
          quantity,
          piecesPerOrderUnit: product.piecesPerOrderUnit,
        }}
        config={{
          allowFlavor: product.allowFlavor,
          allowFrosting: product.allowFrosting,
          allowTopping: product.allowTopping,
          allowWriting: product.allowWriting,
          flavors,
          frostings,
          toppings,
        }}
        singleValues={{
          flavor: singleFlavor,
          frosting: singleFrosting,
          toppings: singleToppings,
          writing: singleWriting,
        }}
        onSingleChange={(data) => {
          if (data.flavor !== undefined) setSingleFlavor(data.flavor);
          if (data.frosting !== undefined) setSingleFrosting(data.frosting);
          if (data.toppings !== undefined) setSingleToppings(data.toppings);
          if (data.writing !== undefined) setSingleWriting(data.writing);
        }}
        portions={portions}
        onPortionsChange={setPortions}
      />

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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={handleAddCake} className="btn-primary">
          Add to Cart
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
