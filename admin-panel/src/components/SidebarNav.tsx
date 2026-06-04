"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface SidebarNavProps {
  onLogout: () => Promise<void>;
}

export default function SidebarNav({ onLogout }: SidebarNavProps) {
  const pathname = usePathname();

  // Helper to determine if route is active
  const isProductsActive = pathname === "/" || pathname.startsWith("/products");
  const isInventoryActive = pathname === "/inventory";
  const isInquiriesActive = pathname === "/inquiries";

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 font-label text-xs tracking-[0.15em] uppercase font-semibold transition-all rounded-none ${
      isActive
        ? "bg-[#c8ff00] text-[#0A0A0A]"
        : "text-[#555555] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]"
    }`;

  return (
    <aside className="w-full md:w-64 bg-white text-[#0A0A0A] flex flex-col border-r border-[#E5E5E5] shrink-0 md:sticky md:top-0 md:h-screen z-20 overflow-hidden">
      {/* Brand Logo Header */}
      <div className="px-6 py-5 border-b border-[#E5E5E5] flex justify-start items-center">
        <Link href="/" aria-label="Eighty Five Eleven home" className="hover:opacity-80 transition-opacity block w-full">
          <Image
            src="/logo.png"
            alt="Eighty Five Eleven"
            width={200}
            height={70}
            className="h-[56px] w-auto object-contain"
            style={{ filter: "invert(1)" }}
            priority
          />
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0 select-none">
        <Link
          href="/"
          className={linkClass(false)}
          onClick={(e) => e.preventDefault()}
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
        </Link>

        <Link
          href="/"
          className={linkClass(isProductsActive)}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span> Products
        </Link>

        <Link
          href="/inventory"
          className={linkClass(isInventoryActive)}
        >
          <span className="material-symbols-outlined text-[18px]">list_alt</span> Inventory
        </Link>

        <Link
          href="/inquiries"
          className={linkClass(isInquiriesActive)}
        >
          <span className="material-symbols-outlined text-[18px]">mail</span> Inquiries
        </Link>

        <Link
          href="#"
          className={linkClass(false)}
          onClick={(e) => e.preventDefault()}
        >
          <span className="material-symbols-outlined text-[18px]">sell</span> Drops
        </Link>

        <Link
          href="#"
          className={linkClass(false)}
          onClick={(e) => e.preventDefault()}
        >
          <span className="material-symbols-outlined text-[18px]">shopping_cart</span> Orders
        </Link>

        <Link
          href="#"
          className={linkClass(false)}
          onClick={(e) => e.preventDefault()}
        >
          <span className="material-symbols-outlined text-[18px]">group</span> Customers
        </Link>

        <Link
          href="#"
          className={linkClass(false)}
          onClick={(e) => e.preventDefault()}
        >
          <span className="material-symbols-outlined text-[18px]">monitoring</span> Analytics
        </Link>

        {/* New Drop Button */}
        <div className="pt-4">
          <button 
            type="button" 
            className="w-full bg-[#0A0A0A] hover:bg-[#222222] text-white py-3 font-label text-[10px] tracking-[0.2em] uppercase font-bold transition-all rounded-none"
            onClick={() => alert("Creating a new drop...")}
          >
            NEW DROP
          </button>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#E5E5E5]">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to log out?")) {
              onLogout();
            }
          }}
          className="w-full bg-[#FAFAFA] border border-[#CCCCCC] hover:border-[#0A0A0A] text-[#0A0A0A] py-3 font-label text-[10px] tracking-[0.2em] uppercase font-semibold transition-all rounded-none flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[14px]">logout</span> LOG OUT
        </button>
      </div>
    </aside>
  );
}
