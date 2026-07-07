import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ScheduleManager } from "@/components/admin/ScheduleManager";

export default async function AdminSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const availability = await prisma.availability.findMany({ orderBy: { date: "asc" } });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">My Schedule</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Block dates when you&apos;re not taking orders.</p>
      <ScheduleManager
        dates={availability.map((a) => ({
          id: a.id,
          date: a.date.toISOString().slice(0, 10),
          isBlocked: a.isBlocked,
          maxOrders: a.maxOrders,
        }))}
      />
    </div>
  );
}
