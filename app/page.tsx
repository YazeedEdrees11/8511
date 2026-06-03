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
  const heroProduct = products[0];

  return (
    <main className="flex-grow">
      {/* HERO */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-2 relative border-b border-on-surface/15 pb-16 lg:pb-24">
        <div className="flex flex-col justify-center px-6 md:px-10 lg:px-20 py-16 lg:py-24">
          <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface/60 mb-6">
            EST. 2021 — AMMAN
          </p>
          <h1 className="font-headline text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-8 text-on-surface">
            EIGHTY<br />FIVE<br />ELEVEN
          </h1>
          <p className="font-body text-lg md:text-xl text-on-surface/80 max-w-md mb-12 leading-relaxed">
            Advocates of the sneaker streetwear culture. High-fashion editorial meets street culture in the heart of Jordan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-on-surface text-surface font-label text-xs uppercase tracking-widest px-8 py-4 hover:bg-primary transition-colors duration-300 rounded max-w-max"
            >
              SHOP NOW <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center border border-on-surface text-on-surface font-label text-xs uppercase tracking-widest px-8 py-4 hover:border-primary hover:text-primary transition-colors duration-300 rounded max-w-max"
            >
              ASK THE ASSISTANT
            </Link>
          </div>
        </div>
        <div className="relative flex items-center justify-center self-center w-full">
          <Image
            src="/hero.png"
            alt="Featured sneaker"
            width={400}
            height={533}
            priority
            className="w-full max-w-[400px] object-contain hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative w-full h-[140px] bg-surface border-y border-on-surface/15 overflow-hidden flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 marquee-fade-left" />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 marquee-fade-right" />
        <BrandMarquee />
      </div>

      {/* FEATURED DROPS */}
      <section className="px-6 md:px-10 lg:px-20 py-24 bg-surface">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <h2 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter text-on-surface leading-none">
            FEATURED<br />DROPS
          </h2>
          <Link
            href="/shop"
            className="font-label text-xs uppercase tracking-[0.2em] text-on-surface hover:text-primary transition-colors underline underline-offset-4 decoration-1"
          >
            VIEW ALL RELEASES
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {featured.map(p => (
            <Link key={p.slug} href={`/product/${p.slug}`} className="group cursor-pointer">
              <div className="aspect-square bg-white border border-on-surface/10 p-8 mb-6 relative overflow-hidden flex items-center justify-center transition-colors group-hover:border-primary">
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-primary">arrow_outward</span>
                </div>
              </div>
              <h3 className="font-headline text-xl md:text-2xl font-bold uppercase tracking-tight text-on-surface mb-2">
                {p.name}
              </h3>
              <p className="font-label text-sm text-on-surface/60 tracking-widest">
                {formatPrice(p) ?? BRAND_LABEL[p.brand.slug]}
              </p>
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
