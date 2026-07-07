import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const [newOrders, pendingReview, newQuotes, upcoming] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "PENDING_REVIEW"] }, depositPaid: true } }),
    prisma.order.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.quoteRequest.count({ where: { status: "QUOTE_REQUESTED" } }),
    prisma.order.findMany({
      where: { status: { in: ["CONFIRMED", "IN_PROGRESS", "READY"] } },
      orderBy: { scheduledDate: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Welcome back, Brandy!</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-3xl font-bold">{newOrders}</p>
          <p className="text-sm text-[var(--warm-gray)]">Active orders</p>
          <Link href="/admin/orders" className="mt-2 inline-block text-sm text-[var(--rose)]">View orders →</Link>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-yellow-600">{pendingReview}</p>
          <p className="text-sm text-[var(--warm-gray)]">Need price review</p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold">{newQuotes}</p>
          <p className="text-sm text-[var(--warm-gray)]">Custom requests</p>
          <Link href="/admin/custom-requests" className="mt-2 inline-block text-sm text-[var(--rose)]">View requests →</Link>
        </div>
      </div>
      <section className="card mt-8">
        <h2 className="font-semibold">Upcoming orders</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--warm-gray)]">No upcoming orders.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcoming.map((o) => (
              <li key={o.id} className="flex justify-between text-sm">
                <span>{o.orderNumber} — {o.customerName}</span>
                <span className="text-[var(--warm-gray)]">{o.scheduledDate.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/menu" className="btn-primary">Add menu item</Link>
        <Link href="/admin/schedule" className="btn-secondary">Block a date</Link>
      </div>
    </div>
  );
}
