import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";

export default async function MenuPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">Our Menu</h1>
          <p className="mt-2 text-[var(--warm-gray)]">All items made fresh to order</p>
        </div>
        <Link href="/custom-order" className="btn-secondary text-sm">Custom Order Request</Link>
      </div>

      <div className="mt-12 space-y-12">
        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">{cat.name}</h2>
            {cat.products.length === 0 ? (
              <p className="mt-4 text-[var(--warm-gray)]">No items available right now.</p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.products.map((p) => (
                  <Link key={p.id} href={`/menu/${p.slug}`} className="card block transition hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.orderType === "SEMI_CUSTOM" && (
                        <span className="shrink-0 rounded-full bg-[var(--blush)] px-2 py-0.5 text-xs">Custom</span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-[var(--warm-gray)]">{p.description}</p>
                    <p className="mt-3 font-semibold text-[var(--rose)]">
                      {p.isStartingPrice ? "Starting at " : ""}{formatCents(p.basePriceCents)}
                    </p>
                    <span className="mt-2 inline-block text-sm text-[var(--sage)]">View details →</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
