import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { StarRating } from "@/components/storefront/StarRating";

export default async function HomePage() {
  const [settings, featured, reviews, products] = await Promise.all([
    prisma.shopSettings.findFirst(),
    prisma.galleryImage.findMany({ where: { isFeatured: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--blush)] to-[var(--cream)] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--sage)]">
            {settings?.location ?? "Dimondale, Michigan"}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--chocolate)] md:text-6xl">
            {settings?.businessName ?? "B's Sweet Spot"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--warm-gray)]">
            {settings?.tagline ?? "Made-to-order cakes & treats crafted with love"}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/order" className="btn-primary">Request Order</Link>
            <Link href="/menu" className="btn-secondary">View Menu</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">About Brandy</h2>
        <p className="mt-4 whitespace-pre-line text-[var(--warm-gray)] leading-relaxed">
          {(settings?.aboutText ?? "").split("\n\n").slice(0, 2).join("\n\n")}
        </p>
        <Link href="/about" className="mt-4 inline-block text-[var(--rose)] hover:underline">Read more →</Link>
      </section>

      {featured.length > 0 && (
        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">From the Gallery</h2>
              <Link href="/gallery" className="text-[var(--rose)] hover:underline">View all</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-2xl">
                  <Image src={img.url} alt={img.alt ?? "Bakery creation"} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">Popular Treats</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/menu/${p.slug}`} className="card transition hover:shadow-md">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--warm-gray)]">{p.description}</p>
              <p className="mt-3 font-semibold text-[var(--rose)]">
                {p.isStartingPrice ? "Starting at " : ""}${(p.basePriceCents / 100).toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
        <Link href="/menu" className="btn-secondary mt-8">View Full Menu</Link>
      </section>

      <section className="bg-[var(--blush)]/30 px-4 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">Something Special in Mind?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--warm-gray)]">
            Wedding cakes, themed designs, or one-of-a-kind creations — tell us your vision and we&apos;ll send you a quote.
          </p>
          <Link href="/custom-order" className="btn-primary mt-6">Request a Custom Order</Link>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">What Customers Say</h2>
            <Link href="/reviews" className="text-[var(--rose)] hover:underline">All reviews</Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <StarRating rating={r.rating} />
                <p className="mt-3 text-sm text-[var(--warm-gray)]">&ldquo;{r.text.slice(0, 120)}...&rdquo;</p>
                <p className="mt-3 text-sm font-semibold">— {r.author}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
