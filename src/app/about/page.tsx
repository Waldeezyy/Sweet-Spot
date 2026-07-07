import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { MENU_PRICING_GUIDE } from "@/lib/cake-pricing";

export default async function AboutPage() {
  const settings = await prisma.shopSettings.findFirst();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">About</h1>
      <div className="card mt-8">
        <p className="whitespace-pre-line leading-relaxed text-[var(--warm-gray)]">{settings?.aboutText}</p>
      </div>

      <section className="card mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Cake &amp; Cupcake Pricing</h2>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">All cakes finished in buttercream unless noted. Custom items show starting prices — final price confirmed after review.</p>

        <h3 className="mt-6 font-semibold">Cupcakes</h3>
        <ul className="mt-2 space-y-2 text-sm text-[var(--warm-gray)]">
          {MENU_PRICING_GUIDE.cupcakes.map((row) => (
            <li key={row.tier}>
              <span className="font-medium text-[var(--chocolate)]">{row.tier}</span>
              {" — "}
              1 dozen {formatCents(row.oneDozen)} · 2 dozen {formatCents(row.twoDozen)}
              {row.note && <span className="block text-xs">({row.note})</span>}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-semibold">Round Cakes</h3>
        <ul className="mt-2 space-y-2 text-sm text-[var(--warm-gray)]">
          {MENU_PRICING_GUIDE.roundCakes.map((row) => (
            <li key={row.size}>
              <span className="font-medium text-[var(--chocolate)]">{row.size}</span>
              {" "}(serves {row.serves}) — Basic {formatCents(row.basicCents)} · Custom from {formatCents(row.customStartCents)}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-semibold">Sheet Cakes</h3>
        <ul className="mt-2 space-y-2 text-sm text-[var(--warm-gray)]">
          {MENU_PRICING_GUIDE.sheetCakes.map((row) => (
            <li key={row.size}>
              <span className="font-medium text-[var(--chocolate)]">{row.size}</span>
              {" "}(serves {row.serves}) — Basic {formatCents(row.basicCents)} · Custom from {formatCents(row.customStartCents)}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-semibold">Add-Ons</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-[var(--warm-gray)]">
          {MENU_PRICING_GUIDE.addOns.map((a) => (
            <li key={a.name}>{a.name} ({a.priceLabel})</li>
          ))}
        </ul>
      </section>

      <section className="card mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Policies</h2>
        <ul className="mt-4 space-y-2 text-[var(--warm-gray)]">
          <li>Order minimum: {formatCents(settings?.orderMinimumCents ?? 2500)}</li>
          <li>Standard orders under {formatCents(settings?.fullPaymentThresholdCents ?? 7500)}: pay in full at checkout</li>
          <li>Larger or custom orders: {settings?.depositPercent ?? 25}% deposit, or pay in full if you prefer</li>
          <li>Lead time needed: {settings?.leadTimeDays ?? 2} days (48 hours)</li>
          <li>Rush orders with less than 48 hours notice: +$15 rush fee (contact Brandy to arrange)</li>
          <li>{settings?.pickupInstructions}</li>
          <li>{settings?.deliveryNote}</li>
          <li>{settings?.allergyNote}</li>
        </ul>
      </section>
    </div>
  );
}
