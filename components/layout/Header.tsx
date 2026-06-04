"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/services", label: "Services" },
  { href: "/inquire", label: "Inquire" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };
  const cart = useCart();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setDisplayName(u?.displayName || u?.email || null);
    });
  }, []);

  async function logout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    setDisplayName(null);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-12 w-full h-[90px] bg-white border-b border-[#E5E5E5] transition-all">
      {/* Logo */}
      <Link href="/" className="flex items-center" aria-label="Eighty Five Eleven home">
        <Image
          src="/logo.png"
          alt="Eighty Five Eleven"
          width={180}
          height={60}
          className="h-[50px] w-auto object-contain"
          style={{ filter: "invert(1)" }}
          priority
        />
      </Link>

      {/* Nav Menu */}
      <nav className="hidden md:flex items-center gap-8">
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`text-sm font-medium transition-all duration-300 relative py-1 ${
              isActive(n.href) 
                ? "text-[#0A0A0A] border-b-2 border-[#0A0A0A]" 
                : "text-[#555555] hover:text-[#0A0A0A]"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      {/* Utility Actions */}
      <div className="flex items-center gap-6">
        {/* Search Icon */}
        <button 
          className="text-[#0A0A0A] hover:opacity-70 transition-opacity flex items-center justify-center"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[22px]">search</span>
        </button>

        {/* Cart Icon */}
        <button
          onClick={cart.open}
          className="relative text-[#0A0A0A] hover:opacity-70 transition-opacity flex items-center justify-center"
          aria-label="Open cart"
        >
          <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
          {cart.itemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[#c8ff00] text-[#0A0A0A] text-[9px] font-bold flex items-center justify-center rounded-full border border-white">
              {cart.itemCount}
            </span>
          )}
        </button>

        {/* User Auth (kept for functionality) */}
        {displayName ? (
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline text-xs text-[#555555]">{displayName}</span>
            <button 
              onClick={logout} 
              className="text-xs text-[#555555] hover:text-[#0A0A0A] font-semibold transition-colors"
            >
              LOG OUT
            </button>
          </div>
        ) : (
          <Link 
            href="/login" 
            className="text-xs text-[#555555] hover:text-[#0A0A0A] font-semibold transition-colors"
          >
            LOG IN
          </Link>
        )}
      </div>
    </header>
  );
}
