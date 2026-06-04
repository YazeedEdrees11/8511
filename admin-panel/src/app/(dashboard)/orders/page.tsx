export default function AdminOrdersPage() {
  return (
    <div className="p-8 md:p-12 flex-grow flex flex-col gap-8 bg-[#F9F9F9]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <h1 className="font-display text-6xl md:text-7xl font-black uppercase tracking-tighter text-[#0A0A0A] leading-[0.85] flex flex-col">
          <span>ORDER</span>
          <span>CONTROL</span>
        </h1>
      </div>

      <div className="bg-white border border-[#E5E5E5] p-10 min-h-[320px] flex flex-col justify-center">
        <span className="material-symbols-outlined text-[32px] text-[#0A0A0A]">shopping_cart</span>
        <h2 className="mt-5 font-display text-2xl font-black uppercase tracking-tight text-[#0A0A0A]">
          Orders
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#666666]">
          Order management is ready for the next workflow. This page keeps the header navigation active without sending admins to a dead route.
        </p>
      </div>
    </div>
  );
}
