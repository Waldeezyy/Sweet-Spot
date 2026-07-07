import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CustomRequestsManager } from "@/components/admin/CustomRequestsManager";

export default async function AdminCustomRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const quotes = await prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Custom Requests</h1>
      <CustomRequestsManager
        quotes={quotes.map((q) => ({
          id: q.id,
          status: q.status,
          customerName: q.customerName,
          customerEmail: q.customerEmail,
          occasion: q.occasion,
          scheduledDate: q.scheduledDate.toISOString(),
          description: q.description,
          servings: q.servings,
          budgetRange: q.budgetRange,
          quotedPriceCents: q.quotedPriceCents,
        }))}
      />
    </div>
  );
}
