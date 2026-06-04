export default function AdminSettingsPage() {
  return (
    <div className="p-8 md:p-12 flex-grow flex flex-col gap-8 bg-[#F9F9F9]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <h1 className="font-display text-6xl md:text-7xl font-black uppercase tracking-tighter text-[#0A0A0A] leading-[0.85] flex flex-col">
          <span>ADMIN</span>
          <span>SETTINGS</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E5E5E5] p-8">
          <span className="font-label text-[10px] tracking-[0.15em] uppercase font-bold text-[#888888]">
            Account
          </span>
          <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-tight text-[#0A0A0A]">
            Admin Profile
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#666666]">
            Signed in as the local VAULT admin account.
          </p>
        </section>

        <section className="bg-white border border-[#E5E5E5] p-8">
          <span className="font-label text-[10px] tracking-[0.15em] uppercase font-bold text-[#888888]">
            System
          </span>
          <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-tight text-[#0A0A0A]">
            Portal Status
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#666666]">
            Inventory, products, and admin session controls are available.
          </p>
        </section>
      </div>
    </div>
  );
}
