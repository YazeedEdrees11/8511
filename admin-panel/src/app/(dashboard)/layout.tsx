import { isAdminAuthenticated } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import { adminLogout } from "@/app/actions/admin";
import SidebarNav from "@/components/SidebarNav";
import AdminHeader from "@/components/AdminHeader";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  async function handleLogout() {
    "use server";
    await adminLogout();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#0A0A0A] flex flex-col md:flex-row font-body">
      {/* Sidebar Nav */}
      <SidebarNav onLogout={handleLogout} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <AdminHeader onLogout={handleLogout} />

        {/* Main Page Content */}
        <main className="flex-grow flex flex-col bg-[#F9F9F9] pt-[144px] lg:pt-[72px]">
          {children}
        </main>
      </div>
    </div>
  );
}
