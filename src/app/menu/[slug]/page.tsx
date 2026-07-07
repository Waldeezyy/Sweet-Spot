import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { AddToOrderButton } from "@/components/storefront/AddToOrderButton";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: { category: true },
  });
  if (!product) notFound();

  const [flavors, toppings] = await Promise.all([
    prisma.flavorOption.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.toppingOption.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

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
          }}
          flavors={flavors.map((f) => f.name)}
          toppings={toppings.map((t) => t.name)}
        />
      </div>
    </div>
  );
}
