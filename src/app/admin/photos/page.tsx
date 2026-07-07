import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PhotoManager } from "@/components/admin/PhotoManager";

export default async function AdminPhotosPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">My Photos</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Upload and manage your gallery photos.</p>
      <PhotoManager images={images.map((i) => ({ id: i.id, url: i.url, isFeatured: i.isFeatured, sortOrder: i.sortOrder }))} />
    </div>
  );
}
