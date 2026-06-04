"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0A0A0A] text-white px-8 md:px-16 py-20 flex flex-col gap-16 border-t border-[#1F1F1F]">
      {/* Footer Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Huge neon green stacked logo */}
        <div className="flex flex-col gap-4">
          <Image
            src="/logo.png"
            alt="Eighty Five Eleven"
            width={220}
            height={80}
            className="h-[70px] w-auto object-contain"
          />
          <p className="text-[13px] text-[#888888] leading-relaxed max-w-[240px] font-sans">
            Curated streetwear and exclusive sneaker releases.
          </p>
        </div>

        {/* Shop column */}
        <div className="flex flex-col gap-4">
          <h3 className="font-label text-xs tracking-[0.2em] uppercase text-[#c8ff00] font-bold">
            SHOP
          </h3>
          <nav className="flex flex-col gap-2 text-[13px] text-[#888888]">
            <Link href="/shop?brand=nike" className="hover:text-white transition-colors">
              Nike
            </Link>
            <Link href="/shop?brand=adidas" className="hover:text-white transition-colors">
              Adidas
            </Link>
            <Link href="/shop?brand=supreme" className="hover:text-white transition-colors">
              Supreme
            </Link>
            <Link href="/shop?brand=jordan" className="hover:text-white transition-colors">
              Jordan
            </Link>
          </nav>
        </div>

        {/* Support column */}
        <div className="flex flex-col gap-4">
          <h3 className="font-label text-xs tracking-[0.2em] uppercase text-[#c8ff00] font-bold">
            SUPPORT
          </h3>
          <nav className="flex flex-col gap-2 text-[13px] text-[#888888]">
            <Link href="/shipping" className="hover:text-white transition-colors">
              Shipping
            </Link>
            <Link href="/returns" className="hover:text-white transition-colors">
              Returns
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/inquire" className="hover:text-white transition-colors">
              Product Inquiry
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact Us
            </Link>
            <Link href="http://localhost:3001" className="hover:text-[#c8ff00] transition-colors font-semibold mt-2">
              Admin Portal
            </Link>
          </nav>
        </div>

        {/* Stay Updated column */}
        <div className="flex flex-col gap-4">
          <h3 className="font-label text-xs tracking-[0.2em] uppercase text-[#c8ff00] font-bold">
            STAY UPDATED
          </h3>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3 w-full max-w-[280px]">
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-[#161616] border border-[#333333] focus:border-[#c8ff00] px-4 py-3 text-xs text-white placeholder-[#555555] focus:outline-none transition-colors rounded-none font-mono"
            />
            <button
              type="submit"
              className="w-full bg-[#0A0A0A] hover:bg-[#c8ff00] text-[#c8ff00] hover:text-[#0A0A0A] border border-[#c8ff00] py-3 text-xs font-label tracking-widest uppercase font-bold transition-all duration-300 rounded-none"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </div>

      {/* Footer Bottom copyright */}
      <div className="border-t border-[#1F1F1F] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-[#555555]">
          © {new Date().getFullYear()} Eighty Five Eleven. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
