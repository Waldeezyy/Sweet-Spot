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

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Orders</h1>
      <OrdersManager
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          scheduledDate: o.scheduledDate.toISOString(),
          totalCents: o.totalCents,
          finalTotalCents: o.finalTotalCents,
          items: o.items.map((i) => ({ productName: i.productName, quantity: i.quantity, designNotes: i.designNotes })),
        }))}
      />
    </div>
  );
}
