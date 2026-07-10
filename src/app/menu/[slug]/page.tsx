import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { AddToOrderButton } from "@/components/storefront/AddToOrderButton";
import { getPartyPackageConfig } from "@/lib/party-packages";
import {
  CUPCAKE_PRICING,
  ROUND_CAKE_SIZES,
  SHEET_CAKE_INFO,
  isCupcakeCategory,
  isRoundCakeCategory,
  isSheetCakeCategory,
} from "@/lib/cake-pricing";
import { getActiveAddOns, getActiveTreatTypes, filterFlavorsForProduct, filterAddOnsForProduct, filterTreatTypesForProduct } from "@/lib/menu-options";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: { category: true },
  });
  if (!product) notFound();

  const partyConfig = product.category.formType === "PARTY_PACKAGE"
    ? getPartyPackageConfig(product.slug)
    : null;

  const [flavors, toppings, addOnOptions, treatTypes] = await Promise.all([
    prisma.flavorOption.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.toppingOption.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getActiveAddOns(),
    getActiveTreatTypes(),
  ]);

  const productFlavors = filterFlavorsForProduct(flavors, product.category.slug, product.slug);
  const productAddOns = filterAddOnsForProduct(addOnOptions, product.category.slug, product.slug);
  const productTreatTypes = filterTreatTypesForProduct(treatTypes, product.category.slug, product.slug);

  const cupcakePricing = isCupcakeCategory(product.category.slug) ? CUPCAKE_PRICING[product.slug] : null;
  const sheetInfo = isSheetCakeCategory(product.category.slug) ? SHEET_CAKE_INFO[product.slug] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/menu" className="text-sm text-[var(--rose)] hover:underline">← Back to menu</Link>
      <div className="card mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--sage)]">{product.category.name}</p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">{product.name}</h1>
          </div>
          <p className="text-2xl font-bold text-[var(--rose)]">
            {product.isStartingPrice ? "Starting at " : ""}{formatCents(product.basePriceCents)}
          </p>
        </div>
        <p className="mt-6 whitespace-pre-line text-[var(--warm-gray)]">{product.description}</p>

        {cupcakePricing && (
          <ul className="mt-4 space-y-1 text-sm text-[var(--warm-gray)]">
            <li>1 dozen — {formatCents(cupcakePricing.oneDozenCents)}</li>
            <li>2 dozen — {formatCents(cupcakePricing.twoDozenCents)}</li>
          </ul>
        )}

        {isRoundCakeCategory(product.category.slug) && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-[var(--warm-gray)]">
              <thead>
                <tr className="border-b border-[var(--blush)] text-left">
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Serves</th>
                  <th className="py-2">
                    {product.slug === "custom-round-cake" ? "Custom" : "Basic"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROUND_CAKE_SIZES.map((size) => (
                  <tr key={size.id} className="border-b border-[var(--blush)]/50">
                    <td className="py-2 pr-4">{size.label}</td>
                    <td className="py-2 pr-4">{size.serves}</td>
                    <td className="py-2">
                      {formatCents(product.slug === "custom-round-cake" ? size.customStartCents : size.basicCents)}
                      {product.slug === "custom-round-cake" && "+"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sheetInfo && (
          <p className="mt-4 text-sm text-[var(--warm-gray)]">
            {sheetInfo.label} — serves {sheetInfo.serves}
          </p>
        )}

        {(product.category.formType === "ROUND_CAKE" || product.category.formType === "SHEET_CAKE") && (
          <div className="mt-4 text-sm text-[var(--warm-gray)]">
            <p className="font-medium">Optional add-ons:</p>
            <ul className="mt-1 list-inside list-disc">
              {productAddOns.map((a) => (
                <li key={a.slug}>{a.name} ({a.priceLabel})</li>
              ))}
            </ul>
          </div>
        )}

        {partyConfig && partyConfig.dozenCount > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-[var(--warm-gray)]">
            <li>{partyConfig.dozenCount} dozen treats</li>
            <li>
              {partyConfig.maxTreatTypes === 1
                ? "1 treat type"
                : `Up to ${partyConfig.maxTreatTypes} treat types`}
            </li>
            {partyConfig.decorNote && <li>{partyConfig.decorNote}</li>}
          </ul>
        )}
        {partyConfig && partyConfig.dozenCount === 0 && (
          <p className="mt-4 text-sm text-[var(--warm-gray)]">{partyConfig.decorNote}</p>
        )}
        {product.orderType === "SEMI_CUSTOM" && (
          <p className="mt-4 rounded-xl bg-[var(--blush)]/40 p-4 text-sm">
            Deposit secures your date. Final price confirmed within 24 hours based on your design.
          </p>
        )}
        <AddToOrderButton
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            basePriceCents: product.basePriceCents,
            orderType: product.orderType,
            allowFlavor: product.allowFlavor,
            allowTopping: product.allowTopping,
            allowFrosting: product.allowFrosting,
            allowWriting: product.allowWriting,
            maxFlavorOptions: product.maxFlavorOptions,
            piecesPerOrderUnit: product.piecesPerOrderUnit,
          }}
          categorySlug={product.category.slug}
          categoryFormType={product.category.formType}
          flavors={productFlavors}
          toppings={toppings.map((t) => t.name)}
          addOnOptions={productAddOns}
          treatTypes={productTreatTypes}
        />
      </div>
    </div>
  );
}
