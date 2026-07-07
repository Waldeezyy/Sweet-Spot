import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--blush)] bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">B&apos;s Sweet Spot</h3>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">Dimondale, Michigan</p>
          <p className="mt-1 text-sm text-[var(--warm-gray)]">Made-to-order cakes & treats</p>
        </div>
        <div>
          <h4 className="font-semibold">Quick Links</h4>
          <ul className="mt-2 space-y-1 text-sm text-[var(--warm-gray)]">
            <li><Link href="/menu" className="hover:text-[var(--chocolate)]">Menu</Link></li>
            <li><Link href="/custom-order" className="hover:text-[var(--chocolate)]">Custom Orders</Link></li>
            <li><Link href="/order" className="hover:text-[var(--chocolate)]">Place an Order</Link></li>
            <li><Link href="/order/track" className="hover:text-[var(--chocolate)]">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Contact</h4>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">
            <a href="mailto:bssweetstop25@gmail.com" className="hover:text-[var(--chocolate)]">
              bssweetstop25@gmail.com
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--blush)] py-4 text-center text-xs text-[var(--warm-gray)]">
        © {new Date().getFullYear()} B&apos;s Sweet Spot. All rights reserved.
      </div>
    </footer>
  );
}
