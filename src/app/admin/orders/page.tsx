import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrdersManager } from "@/components/admin/OrdersManager";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const productIds = [
    ...new Set(orders.flatMap((o) => o.items.map((i) => i.productId).filter(Boolean) as string[])),
  ];
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, orderType: true },
        })
      : [];
  const semiCustomProductIds = new Set(
    products.filter((p) => p.orderType === "SEMI_CUSTOM").map((p) => p.id)
  );

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Orders</h1>
      <OrdersManager
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          trackingToken: o.trackingToken,
          status: o.status,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          scheduledDate: o.scheduledDate.toISOString(),
          totalCents: o.totalCents,
          finalTotalCents: o.finalTotalCents,
          depositCents: o.depositCents,
          balanceDueCents: o.balanceDueCents,
          paidInFull: o.paidInFull,
          depositPaid: o.depositPaid,
          isRush: o.isRush,
          paymentToken: o.paymentToken,
          hasSemiCustom: o.items.some(
            (i) => i.productId && semiCustomProductIds.has(i.productId)
          ),
          items: o.items.map((i) => ({
            productName: i.productName,
            productSlug: i.productSlug,
            quantity: i.quantity,
            flavor: i.flavor,
            frosting: i.frosting,
            toppings: i.toppings,
            designNotes: i.designNotes,
          })),
        }))}
      />
    </div>
  );
}
