import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { MenuManager } from "@/components/admin/MenuManager";
import { parsePriceTiers } from "@/lib/product-price-tiers";

export default async function AdminMenuPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ include: { category: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">My Menu</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Add, edit, or hide menu items. Changes go live immediately.</p>
      <MenuManager
        categories={categories.map((c) => ({ id: c.id, name: c.name, formType: c.formType }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          basePriceCents: p.basePriceCents,
          isStartingPrice: p.isStartingPrice,
          orderType: p.orderType,
          isActive: p.isActive,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          categoryFormType: p.category.formType,
          imageUrl: p.imageUrl,
          sortOrder: p.sortOrder,
          allowFlavor: p.allowFlavor,
          allowTopping: p.allowTopping,
          allowFrosting: p.allowFrosting,
          allowWriting: p.allowWriting,
          maxFlavorOptions: p.maxFlavorOptions,
          piecesPerOrderUnit: p.piecesPerOrderUnit,
          priceTiers: parsePriceTiers(p.priceTiers),
        }))}
      />
    </div>
  );
}
