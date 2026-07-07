import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CartProvider } from "@/components/storefront/CartProvider";
import { Providers } from "@/components/Providers";
import LocalBusinessJsonLd from "@/components/storefront/LocalBusinessJsonLd";

export const dynamic = "force-dynamic";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "B's Sweet Spot | Custom Cakes & Treats in Dimondale, MI",
    template: "%s | B's Sweet Spot",
  },
  description:
    "Made-to-order cakes, cupcakes, and treats from Brandy at B's Sweet Spot in Dimondale, Michigan. Order online for pickup or delivery.",
  openGraph: {
    title: "B's Sweet Spot",
    description: "Custom cakes & treats made with love in Dimondale, Michigan",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} flex min-h-screen flex-col antialiased`}>
        <Providers>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </Providers>
        <LocalBusinessJsonLd />
      </body>
    </html>
  );
}
