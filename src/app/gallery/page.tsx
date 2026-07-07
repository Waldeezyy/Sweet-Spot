import { prisma } from "@/lib/db";
import { GalleryGrid } from "@/components/storefront/GalleryGrid";

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">Gallery</h1>
      <p className="mt-2 text-[var(--warm-gray)]">A taste of what we create</p>
      <GalleryGrid images={images} />
    </div>
  );
}
