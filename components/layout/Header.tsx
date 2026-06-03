"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const NAV = [
  { href: "/shop", label: "SHOP" },
  { href: "/services", label: "SERVICES" },
  { href: "/about", label: "ABOUT" },
  { href: "/contact", label: "CONTACT" },
  { href: "/inquire", label: "INQUIRE" },
  { href: "/chat", label: "ASK 8511" },
];

export default function Header() {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const cart = useCart();
  const [displayName, setDisplayName] = useState<string | null>(null);
  useEffect(() => onAuthStateChanged(auth, (u) => setDisplayName(u?.displayName || u?.email || null)), []);

  async function logout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    await fetch("/api/cart", { method: "DELETE" });
    setDisplayName(null);
    window.location.href = "/";
  }
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
        {displayName ? (
          <div className="flex items-center gap-3">
            <span className="hidden md:inline font-label text-[11px] tracking-widest text-on-surface/80">{displayName}</span>
            <button onClick={logout} className="font-label text-[11px] tracking-widest text-on-surface/70 hover:text-primary transition-colors">
              LOG OUT
            </button>
          </div>
        ) : (
          <Link href="/login" className="font-label text-[11px] tracking-widest text-on-surface/70 hover:text-primary transition-colors">
            LOG IN
          </Link>
        )}
      </div>
    </header>
  );
}
