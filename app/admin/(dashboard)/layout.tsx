import { isAdminAuthenticated } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { adminLogout } from "@/app/actions/admin";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  async function handleLogout() {
    "use server";
    await adminLogout();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#0A0A0A] flex flex-col md:flex-row font-body">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
      />
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0A0A0A] text-[#F7F7F4] flex flex-col border-r border-[#0A0A0A]/10 shrink-0">
        <div className="p-8 border-b border-[#F7F7F4]/10">
          <Link href="/" className="font-display text-3xl uppercase tracking-tighter hover:text-primary transition-colors block">
            8511
          </Link>
          <span className="font-label text-[9px] tracking-widest text-[#F7F7F4]/40 uppercase block mt-1">BACKOFFICE SYSTEM</span>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 font-label text-xs tracking-widest uppercase hover:bg-primary hover:text-[#0A0A0A] transition-all rounded-sm"
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span> PRODUCTS
          </Link>

          <Link
            href="/admin/inventory"
            className="flex items-center gap-3 px-4 py-3 font-label text-xs tracking-widest uppercase hover:bg-primary hover:text-[#0A0A0A] transition-all rounded-sm"
          >
            <span className="material-symbols-outlined text-[16px]">list_alt</span> STOCK & CAPACITY
          </Link>

          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 font-label text-xs tracking-widest uppercase hover:bg-[#202020] transition-all rounded-sm text-[#F7F7F4]/60"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span> STOREFRONT
          </a>
        </nav>

        <div className="p-6 border-t border-[#F7F7F4]/10">
          <form action={handleLogout}>
            <button
              type="submit"
              className="w-full bg-[#202020] text-[#F7F7F4]/80 py-3 font-label text-[10px] tracking-widest uppercase hover:bg-red-900 hover:text-white transition-all rounded-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xs">logout</span> LOG OUT
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-h-screen bg-[#F7F7F4] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
