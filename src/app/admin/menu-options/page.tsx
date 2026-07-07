import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { MenuOptionsManager } from "@/components/admin/MenuOptionsManager";

export default async function MenuOptionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const [flavors, addOns, treatTypes, categories] = await Promise.all([
    prisma.flavorOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.addOnOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.treatTypeOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { name: true, slug: true },
        },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Menu Options</h1>
      <p className="mt-2 text-[var(--warm-gray)]">
        Manage flavors, add-ons, and party treat types. Choose which categories or specific products each option appears on.
      </p>
      <MenuOptionsManager
        categories={categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          products: c.products,
        }))}
        flavors={flavors}
        addOns={addOns}
        treatTypes={treatTypes}
      />
    </div>
  );
}
