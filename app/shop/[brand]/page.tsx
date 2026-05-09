import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { loadProducts } from "@/lib/catalog";

const BRANDS = ["nike", "adidas", "supreme", "hats"] as const;
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

export default async function Brand({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  if (!(BRANDS as readonly string[]).includes(brand)) notFound();
  const products = loadProducts().filter(p => p.brand === brand);
  const label = BRAND_LABEL[brand];
  return (
    <main className="flex-grow">
      <section className="w-full bg-paper px-8 py-16 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-ink/10 gap-8">
        <h1 className="font-headline text-8xl md:text-9xl tracking-tighter leading-none text-ink">
          {label}
        </h1>
        <div className="flex flex-wrap gap-2 mb-2">
          {FILTERS.map(f => {
            const active = (f.href === "/shop" && brand === "") || f.href === `/shop/${brand}`;
            return (
              <Link
                key={f.href}
                href={f.href}
                className={
                  active
                    ? "px-4 py-2 bg-ink text-white font-label text-xs tracking-wider uppercase rounded-sm border border-ink hover:bg-accent hover:border-accent transition-colors"
                    : "px-4 py-2 bg-transparent text-ink font-label text-xs tracking-wider uppercase rounded-sm border border-ink/20 hover:border-accent hover:text-accent transition-colors"
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="w-full px-8 py-6 flex justify-between items-center bg-paper">
        <span className="font-label text-xs tracking-widest uppercase text-ink/60">
          {products.length} ITEMS
        </span>
        <button className="font-label text-xs tracking-widest uppercase text-ink flex items-center gap-1 hover:text-accent transition-colors">
          SORT: NEWEST <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
        </button>
      </section>

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
                  {label}
                </span>
                <h3 className="font-headline text-lg tracking-tight uppercase text-ink leading-tight">
                  {p.name}
                </h3>
                {p.price && <p className="font-body text-sm text-ink mt-1">{p.price}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
