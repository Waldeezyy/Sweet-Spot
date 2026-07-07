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
      <p className="mt-2 text-[var(--warm-gray)]">
        Review requests, contact the customer, send a quote link, or mark Venmo/cash payments.
      </p>
      <CustomRequestsManager
        quotes={quotes.map((q) => ({
          id: q.id,
          status: q.status,
          customerName: q.customerName,
          customerEmail: q.customerEmail,
          customerPhone: q.customerPhone,
          occasion: q.occasion,
          scheduledDate: q.scheduledDate.toISOString(),
          description: q.description,
          servings: q.servings,
          budgetRange: q.budgetRange,
          dietaryNotes: q.dietaryNotes,
          quotedPriceCents: q.quotedPriceCents,
          paymentToken: q.paymentToken,
          offlinePaymentNote: q.offlinePaymentNote,
        }))}
      />
    </div>
  );
}
