import Link from "next/link";
import Image from "next/image";
import { loadProducts, loadKB } from "@/lib/catalog";
import BrandMarquee from "@/components/layout/BrandMarquee";

export const dynamic = "force-dynamic";

function formatPrice(p: { basePrice: { toString(): string } | null }) {
  return p.basePrice ? `${p.basePrice.toString()} JOD` : null;
}

const BRAND_LABEL: Record<string, string> = {
  nike: "NIKE",
  adidas: "ADIDAS",
  supreme: "SUPREME",
  hats: "HATS",
};

export default async function Home() {
  const products = await loadProducts();
  const featured = products.slice(0, 3);
  const services = loadKB().filter(c => c.type === "service").slice(0, 4);
  return (
    <main className="flex-grow">
      {/* HERO */}
      <section className="relative h-[calc(100vh-90px)] overflow-hidden border-b border-on-surface/15 bg-white grid grid-cols-1 md:grid-cols-[42%_58%]">
        {/* LEFT — Text content on solid white */}
        <div className="relative z-10 flex flex-col justify-center bg-white px-6 py-10 md:px-10 lg:pl-20 lg:pr-12">
          <p className="font-label text-[10px] uppercase tracking-[0.42em] text-on-surface/50 mb-5">
            EST. 2021 — AMMAN
          </p>
          <h1 className="font-headline text-[64px] sm:text-[80px] md:text-[96px] lg:text-[110px] xl:text-[120px] font-black uppercase tracking-normal leading-[0.82] mb-8 text-on-surface">
            EIGHTY<br />FIVE<br />ELEVEN
          </h1>
          <p className="font-body text-[15px] md:text-[16px] lg:text-[17px] text-on-surface/75 max-w-[380px] mb-10 leading-[1.65]">
            Advocates of the sneaker streetwear culture.
            High-fashion editorial meets street culture in
            the heart of Jordan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/shop"
              className="inline-flex h-[52px] min-w-[180px] items-center justify-center bg-on-surface text-surface font-label text-[11px] uppercase tracking-[0.18em] px-7 hover:bg-primary hover:text-on-surface transition-colors duration-300 rounded-[4px] max-w-max font-bold"
            >
              SHOP NOW <span className="material-symbols-outlined ml-4 text-[22px]">arrow_forward</span>
            </Link>
            <Link
              href="/chat"
              className="inline-flex h-[52px] min-w-[220px] items-center justify-center border border-on-surface text-on-surface bg-white/55 font-label text-[11px] uppercase tracking-[0.18em] px-7 hover:border-primary hover:text-on-surface hover:bg-primary transition-colors duration-300 rounded-[4px] max-w-max font-semibold backdrop-blur-[1px]"
            >
              ASK THE ASSISTANT
            </Link>
          </div>
        </div>

        {/* RIGHT — Sneaker image */}
        <div className="relative hidden md:block">
          <Image
            src="/hero.png"
            alt="Featured sneaker"
            fill
            priority
            sizes="58vw"
            className="object-cover object-[center_center]"
          />
          {/* Gradient fade on left edge of image to blend into white */}
          <div className="absolute inset-y-0 left-0 w-[120px] bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.6)_40%,rgba(255,255,255,0)_100%)]" />
        </div>

        {/* Mobile fallback — show image below text */}
        <div className="relative h-[300px] md:hidden">
          <Image
            src="/hero.png"
            alt="Featured sneaker"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </section>

      {/* BRAND TICKER */}
      <div className="relative w-full h-[90px] bg-[#0A0A0A] border-y border-on-surface/10 overflow-hidden flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-[linear-gradient(to_right,#0A0A0A,transparent)]" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-[linear-gradient(to_left,#0A0A0A,transparent)]" />
        <BrandMarquee />
      </div>

      {/* FEATURED DROPS */}
      <section className="px-6 md:px-10 lg:px-20 py-28 bg-surface">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface/40 mb-3">
              LATEST ARRIVALS
            </p>
            <h2 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter text-on-surface leading-none">
              FEATURED DROPS
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.2em] text-on-surface/70 hover:text-on-surface transition-colors group"
          >
            VIEW ALL RELEASES
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
        {/* Thin rule */}
        <div className="w-full h-px bg-on-surface/10 mb-14" />

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-9">
          {featured.map((p, i) => (
            <Link
              key={p.slug}
              href={`/product/${p.slug}`}
              className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-500 ease-out"
            >
              {/* Accent line — reveals on hover */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-20" />

              {/* Image area */}
              <div className="relative aspect-square bg-white overflow-hidden">
                {/* Brand badge — frosted glass */}
                <span className="absolute top-4 right-4 z-10 font-label text-[9px] uppercase tracking-[0.18em] bg-white/90 backdrop-blur-md text-on-surface/85 px-3.5 py-1.5 rounded-full font-semibold border border-on-surface/[0.08]">
                  {p.brand.name}
                </span>

                {/* Product image */}
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                />

                {/* Quick View button — slides up on hover */}
                <div className="absolute bottom-0 inset-x-0 flex justify-center pb-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
                  <span className="inline-flex items-center gap-2 bg-on-surface text-surface font-label text-[10px] uppercase tracking-[0.18em] px-6 py-2.5 rounded-full font-semibold shadow-lg">
                    QUICK VIEW
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </span>
                </div>

                {/* Hover dim overlay */}
                <div className="absolute inset-0 bg-black/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>

              {/* Product info */}
              <div className="flex flex-col gap-2 px-5 py-5">
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface/40">
                  {p.brand.name}
                </p>
                <h3 className="font-headline text-lg md:text-xl font-bold uppercase tracking-tight text-on-surface leading-snug line-clamp-2">
                  {p.name}
                </h3>
                {formatPrice(p) && (
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="w-[3px] h-4 bg-primary rounded-full" />
                    <p className="font-label text-[14px] font-bold text-on-surface tracking-wide">
                      {formatPrice(p)}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MORE THAN A SHOP */}
      <section className="px-6 md:px-10 lg:px-20 py-24 border-t border-on-surface/15 bg-surface">
        <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-on-surface mb-16">
          MORE THAN A SHOP
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {services.map((s, i) => (
            <div
              key={s.id}
              className="flex items-start gap-6 group cursor-default pb-8 border-b border-on-surface/10"
            >
              <span className="font-headline text-4xl font-bold text-primary leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-headline text-2xl font-bold uppercase tracking-tight text-on-surface mb-2 group-hover:text-primary transition-colors">
                  {s.title}
                </h3>
                <p className="font-body text-sm text-on-surface/70">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Link
            href="/services"
            className="inline-flex items-center justify-center border border-on-surface text-on-surface font-label text-xs uppercase tracking-widest px-8 py-4 hover:border-primary hover:text-primary transition-colors duration-300 rounded"
          >
            ALL EIGHT SERVICES <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* STORE LOCATOR */}
      <section className="px-6 md:px-10 lg:px-20 py-32 bg-[#09090b] text-[#fafaf9] flex flex-col items-center text-center">
        <h2 className="font-headline text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-8 leading-tight">
          VISIT US — SWEFIEH VILLAGE<br />AMMAN · JORDAN
        </h2>
        <p className="font-label text-sm uppercase tracking-widest text-[#fafaf9]/70 mb-12 max-w-lg">
          Experience the curation in person. Open daily from 12:00 PM to 10:00 PM.
        </p>
        <a
          href="https://maps.google.com/?cid=15121294295697539889"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center bg-[#fafaf9] text-[#09090b] font-label text-xs uppercase tracking-widest px-8 py-4 hover:bg-primary hover:text-white transition-colors duration-300 rounded"
        >
          OPEN IN GOOGLE MAPS <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
        </a>
      </section>
    </main>
  );
}
