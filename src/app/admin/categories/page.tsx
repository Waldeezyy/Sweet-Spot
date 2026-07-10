import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Categories</h1>
      <p className="mt-2 text-[var(--warm-gray)]">
        Organize your menu and choose how customers customize items in each category. Use the arrows to set the order categories show on your menu page.
      </p>
      <CategoriesManager categories={categories} />
    </div>
  );
}
