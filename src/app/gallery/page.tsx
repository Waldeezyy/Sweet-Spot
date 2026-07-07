import Image from "next/image";
import { prisma } from "@/lib/db";

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">Gallery</h1>
      <p className="mt-2 text-[var(--warm-gray)]">A taste of what we create</p>
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-2xl">
            <Image src={img.url} alt={img.alt ?? "Bakery creation"} fill className="object-cover" unoptimized />
          </div>
        ))}
      </div>
    </div>
  );
}
