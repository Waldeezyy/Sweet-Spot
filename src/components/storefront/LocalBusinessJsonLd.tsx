import { prisma } from "@/lib/db";

export default async function LocalBusinessJsonLd() {
  const settings = await prisma.shopSettings.findFirst();
  if (!settings) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: settings.businessName,
    description: settings.tagline,
    email: settings.contactEmail,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dimondale",
      addressRegion: "MI",
      addressCountry: "US",
    },
    areaServed: settings.location,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
