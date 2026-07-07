import { prisma } from "@/lib/db";
import { StarRating } from "@/components/storefront/StarRating";
import { format } from "date-fns";

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">Ratings & Reviews</h1>
      <div className="card mt-8 flex flex-wrap items-center gap-8">
        <div className="text-center">
          <p className="text-4xl font-bold">{avg.toFixed(1)}</p>
          <StarRating rating={Math.round(avg)} />
          <p className="mt-1 text-sm text-[var(--warm-gray)]">{reviews.length} ratings</p>
        </div>
        <div className="flex-1 space-y-1">
          {breakdown.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-12">{star} stars</span>
              <div className="h-2 flex-1 rounded-full bg-[var(--blush)]">
                <div className="h-2 rounded-full bg-yellow-500" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }} />
              </div>
              <span className="w-6 text-[var(--warm-gray)]">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 space-y-6">
        {reviews.map((r) => (
          <article key={r.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{r.itemName ?? "Review"}</h2>
                <p className="text-sm text-[var(--warm-gray)]">{r.author} · {format(r.createdAt, "MMM d, yyyy")}</p>
              </div>
              <StarRating rating={r.rating} />
            </div>
            <p className="mt-4 text-[var(--warm-gray)]">{r.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
