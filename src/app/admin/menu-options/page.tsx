import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { MenuOptionsManager } from "@/components/admin/MenuOptionsManager";

export default async function MenuOptionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const [flavors, addOns, treatTypes] = await Promise.all([
    prisma.flavorOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.addOnOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.treatTypeOption.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Menu Options</h1>
      <p className="mt-2 text-[var(--warm-gray)]">
        Manage flavors, add-ons, and party treat types that customers can choose when ordering.
      </p>
      <MenuOptionsManager flavors={flavors} addOns={addOns} treatTypes={treatTypes} />
    </div>
  );
}
