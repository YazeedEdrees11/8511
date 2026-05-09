import Link from "next/link";
import Image from "next/image";
import { loadProducts } from "@/lib/catalog";

const BRAND_LABEL: Record<string, string> = {
  nike: "NIKE",
  adidas: "ADIDAS",
  supreme: "SUPREME",
  hats: "HATS",
};

const FILTERS: { href: string; label: string }[] = [
  { href: "/shop", label: "ALL" },
  { href: "/shop/nike", label: "NIKE" },
  { href: "/shop/adidas", label: "ADIDAS" },
  { href: "/shop/supreme", label: "SUPREME" },
  { href: "/shop/hats", label: "HATS" },
];

export default function Shop() {
  const products = loadProducts();
  return (
    <main className="flex-grow">
      {/* Page Intro Band — direct from Stitch */}
      <section className="w-full bg-paper px-8 py-16 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-ink/10 gap-8">
        <h1 className="font-headline text-8xl md:text-9xl tracking-tighter leading-none text-ink">
          SHOP
        </h1>
        <div className="flex flex-wrap gap-2 mb-2">
          {FILTERS.map((f, i) => (
            <Link
              key={f.href}
              href={f.href}
              className={
                i === 0
                  ? "px-4 py-2 bg-ink text-white font-label text-xs tracking-wider uppercase rounded-sm border border-ink hover:bg-accent hover:border-accent transition-colors"
                  : "px-4 py-2 bg-transparent text-ink font-label text-xs tracking-wider uppercase rounded-sm border border-ink/20 hover:border-accent hover:text-accent transition-colors"
              }
            >
              {f.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Sub-row */}
      <section className="w-full px-8 py-6 flex justify-between items-center bg-paper">
        <span className="font-label text-xs tracking-widest uppercase text-ink/60">
          {products.length} ITEMS
        </span>
        <button className="font-label text-xs tracking-widest uppercase text-ink flex items-center gap-1 hover:text-accent transition-colors">
          SORT: NEWEST <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
        </button>
      </section>

      {/* Product Grid */}
      <section className="w-full px-8 pb-24 bg-paper">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12">
          {products.map(p => (
            <Link
              key={p.slug}
              href={`/product/${p.slug}`}
              className="group block border border-transparent hover:border-accent transition-colors duration-200"
            >
              <div className="aspect-square bg-white mb-4 relative overflow-hidden flex items-center justify-center p-8">
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 p-8"
                />
              </div>
              <div className="px-1 flex flex-col gap-1">
                <span className="font-label text-[11px] tracking-widest uppercase text-ink/50">
                  {BRAND_LABEL[p.brand]}
                </span>
                <h3 className="font-headline text-lg tracking-tight uppercase text-ink leading-tight">
                  {p.name}
                </h3>
                {p.price && <p className="font-body text-sm text-ink mt-1">{p.price}</p>}
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="w-full flex justify-center items-center mt-20 gap-6">
          <button className="font-label text-xs tracking-widest uppercase text-ink/40 hover:text-ink transition-colors">
            ← PREV
          </button>
          <div className="flex gap-4 font-label text-xs tracking-widest">
            <button className="text-accent">01</button>
            <button className="text-ink/40 hover:text-ink transition-colors">02</button>
            <button className="text-ink/40 hover:text-ink transition-colors">03</button>
          </div>
          <button className="font-label text-xs tracking-widest uppercase text-ink hover:text-accent transition-colors">
            NEXT →
          </button>
        </div>
      </section>
    </main>
  );
}
