import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";

export default async function AboutPage() {
  const settings = await prisma.shopSettings.findFirst();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">About</h1>
      <div className="card mt-8">
        <p className="whitespace-pre-line leading-relaxed text-[var(--warm-gray)]">{settings?.aboutText}</p>
      </div>
      <section className="card mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Policies</h2>
        <ul className="mt-4 space-y-2 text-[var(--warm-gray)]">
          <li>Order minimum: {formatCents(settings?.orderMinimumCents ?? 2500)}</li>
          <li>Typical deposit: {settings?.depositPercent ?? 25}%</li>
          <li>Lead time needed: {settings?.leadTimeDays ?? 2} days</li>
          <li>{settings?.pickupInstructions}</li>
          <li>{settings?.deliveryNote}</li>
          <li>{settings?.allergyNote}</li>
        </ul>
      </section>
    </div>
  );
}
