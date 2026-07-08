import { prisma } from "@/lib/db";

export async function orderHasSemiCustomItems(
  items: { productId: string | null }[]
): Promise<boolean> {
  const productIds = items.map((i) => i.productId).filter(Boolean) as string[];
  if (!productIds.length) return false;
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { orderType: true },
  });
  return products.some((p) => p.orderType === "SEMI_CUSTOM");
}
