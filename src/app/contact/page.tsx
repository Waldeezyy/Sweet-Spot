import { prisma } from "@/lib/db";
import { ContactForm } from "@/components/storefront/ContactForm";

export default async function ContactPage() {
  const settings = await prisma.shopSettings.findFirst();

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">Contact</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Questions? We&apos;d love to hear from you.</p>
      <div className="card mt-8">
        <p className="text-sm text-[var(--warm-gray)]">
          Email:{" "}
          <a href={`mailto:${settings?.contactEmail}`} className="text-[var(--rose)] hover:underline">
            {settings?.contactEmail}
          </a>
        </p>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">{settings?.location}</p>
      </div>
      <ContactForm />
    </div>
  );
}
