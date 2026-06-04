"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

interface AdminHeaderProps {
  onLogout: () => Promise<void>;
}

const topLinks = [
  { href: "/inventory", label: "Inventory" },
  { href: "/orders", label: "Orders" },
  { href: "/settings", label: "Settings" },
];

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    } else {
      params.delete("q");
    }

    const targetPath = pathname === "/inventory" ? "/inventory" : "/";
    const nextQuery = params.toString();
    router.push(nextQuery ? `${targetPath}?${nextQuery}` : targetPath);
  }

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 z-40 bg-white border-b border-[#E5E5E5] min-h-[72px] px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-[0_1px_0_rgba(10,10,10,0.02)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 lg:gap-10 pt-4 lg:pt-0">
        <Link
          href="/"
          className="font-display font-black text-lg tracking-wider uppercase text-[#0A0A0A] hover:opacity-75 transition-opacity whitespace-nowrap"
        >
          VAULT ADMIN
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4 h-auto lg:h-[72px] overflow-x-auto">
          {topLinks.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-label text-[11px] tracking-[0.15em] uppercase h-10 lg:h-full flex items-center px-3 pt-0.5 border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "font-bold text-[#0A0A0A] border-[#c8ff00]"
                    : "font-semibold text-[#888888] border-transparent hover:text-[#0A0A0A]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div ref={menuRef} className="flex items-center gap-3 sm:gap-5 pb-4 lg:pb-0">
        <form onSubmit={handleSearch} className="relative w-full sm:w-60 xl:w-72">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999] text-[18px]">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            className="w-full bg-[#FAFAFA] border border-[#E5E5E5] focus:border-[#0A0A0A] pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors font-mono text-[#0A0A0A]"
          />
        </form>

        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
            className="text-[#0A0A0A] hover:opacity-75 transition-opacity flex items-center justify-center h-10 w-10 border border-transparent hover:border-[#E5E5E5]"
          >
            <span className="material-symbols-outlined text-[21px]">notifications</span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white border border-[#E5E5E5] shadow-lg p-4">
              <span className="font-label text-[10px] tracking-[0.15em] uppercase font-bold text-[#0A0A0A]">
                Notifications
              </span>
              <p className="mt-3 text-sm text-[#666666]">No new admin alerts.</p>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Admin profile"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            className="text-[#0A0A0A] hover:opacity-75 transition-opacity flex items-center justify-center h-10 w-10 border border-transparent hover:border-[#E5E5E5]"
          >
            <span className="material-symbols-outlined text-[23px]">account_circle</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-[#E5E5E5] shadow-lg p-2">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-3 font-label text-[11px] tracking-[0.1em] uppercase font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to log out?")) {
                    onLogout();
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-3 font-label text-[11px] tracking-[0.1em] uppercase font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
