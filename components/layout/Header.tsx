"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

const NAV = [
  { href: "/shop", label: "SHOP" },
  { href: "/services", label: "SERVICES" },
  { href: "/about", label: "ABOUT" },
  { href: "/contact", label: "CONTACT" },
  { href: "/chat", label: "ASK 8511" },
];

export default function Header() {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const cart = useCart();
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-10 w-full h-[80px] bg-surface border-b border-on-surface/15 transition-all">
      <Link href="/" className="flex items-center gap-2" aria-label="Eighty Five Eleven home">
        <span className="font-headline text-3xl font-black tracking-tighter text-on-surface">
          8511
        </span>
      </Link>
      <nav className="hidden md:flex items-center gap-8">
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`uppercase tracking-widest text-[12px] font-label hover:text-primary transition-colors duration-300 ${
              isActive(n.href) ? "text-on-surface" : "text-on-surface/70"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-6">
        <button
          onClick={cart.open}
          className="relative text-on-surface hover:text-primary transition-colors duration-300 active:opacity-80"
          aria-label="Open cart"
        >
          <span className="material-symbols-outlined">shopping_bag</span>
          {cart.itemCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-primary text-paper text-[9px] font-label flex items-center justify-center">
              {cart.itemCount}
            </span>
          )}
        </button>
        <button className="text-on-surface hover:text-primary transition-colors duration-300 active:opacity-80">
          <span className="material-symbols-outlined">person</span>
        </button>
      </div>
    </header>
  );
}
