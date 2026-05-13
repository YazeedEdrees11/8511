# 8511 — Design Context

Full source of every page, shared component, design tokens, types, and content data for the 8511 storefront.
Next.js 15 App Router + Tailwind v4 + TypeScript.

---

## `app/globals.css`

```css
@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Public+Sans:wght@400;700;900&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500&family=Material+Symbols+Outlined&display=swap");
@import "tailwindcss";

@theme {
  /* 8511 palette — both naming conventions exposed */
  --color-paper: #F7F7F4;
  --color-ink: #0A0A0A;
  --color-accent: #FF3B00;

  --color-surface: #F7F7F4;
  --color-on-surface: #0A0A0A;
  --color-primary: #FF3B00;

  --color-muted: #6b6b6b;
  --color-line: #1f1f1f;

  /* Typography */
  --font-headline: "Bebas Neue", "Public Sans", "Inter", sans-serif;
  --font-display: "Bebas Neue", "Public Sans", "Inter", sans-serif;
  --font-body: "Inter", "Helvetica Neue", sans-serif;
  --font-label: "Space Grotesk", "Inter", sans-serif;

  --tracking-wider2: 0.2em;

  --radius-default: 0.125rem;
  --radius-lg: 0.25rem;
  --radius-xl: 0.5rem;
}

html, body {
  background: var(--color-paper);
  color: var(--color-ink);
}

body {
  font-family: var(--font-body);
}

h1, h2, h3 {
  font-family: var(--font-headline);
  letter-spacing: -0.02em;
  line-height: 0.85;
}

.material-symbols-outlined {
  font-family: "Material Symbols Outlined";
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  direction: ltr;
  -webkit-font-feature-settings: "liga";
  -webkit-font-smoothing: antialiased;
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}

/* Infinite horizontal marquee */
@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  display: flex;
  width: max-content;
  animation: marquee 30s linear infinite;
}

/* Sneaker icon — slow continuous rotation while assistant is thinking */
@keyframes sneaker-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.animate-sneaker-spin {
  animation: sneaker-spin 2s linear infinite;
}

/* Subtle scale pulse for assistant indicator */
@keyframes sneaker-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.08); opacity: 0.85; }
}
.animate-sneaker-pulse {
  animation: sneaker-pulse 2.5s ease-in-out infinite;
}
.marquee-fade-left {
  background: linear-gradient(to right, var(--color-paper), transparent);
}
.marquee-fade-right {
  background: linear-gradient(to left, var(--color-paper), transparent);
}
```


## `app/layout.tsx`

```tsx
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";

export const metadata = {
  title: "Eighty Five Eleven | Amman",
  description: "Streetwear, sneakers, and accessories — Swefieh Village, Amman.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
```


## `app/page.tsx`

```tsx
import Link from "next/link";
import Image from "next/image";
import { loadProducts, loadKB } from "@/lib/catalog";
import BrandMarquee from "@/components/layout/BrandMarquee";

const BRAND_LABEL: Record<string, string> = {
  nike: "NIKE",
  adidas: "ADIDAS",
  supreme: "SUPREME",
  hats: "HATS",
};

export default function Home() {
  const products = loadProducts();
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
                  src={p.image_url}
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
                {p.price ?? BRAND_LABEL[p.brand]}
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
```


## `app/shop/page.tsx`

```tsx
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
```


## `app/shop/[brand]/page.tsx`

```tsx
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
```


## `app/product/[slug]/page.tsx`

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadProducts } from "@/lib/catalog";

const BRAND_LABEL: Record<string, string> = {
  nike: "NIKE",
  adidas: "ADIDAS",
  supreme: "SUPREME",
  hats: "HATS",
};

function extractSpecs(description: string) {
  const out: { key: string; value: string }[] = [];
  const tokens = description.replace(/[`*]/g, "").split(/\s+/);
  const known = ["STYLE", "COLORWAY", "RELEASE", "DATE", "MATERIAL", "RETAIL"];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i].toUpperCase();
    if (known.includes(t)) {
      const valueParts: string[] = [];
      let j = i + 1;
      if (t === "RELEASE" && tokens[j]?.toUpperCase() === "DATE") j++;
      while (j < tokens.length && !known.includes(tokens[j].toUpperCase())) {
        valueParts.push(tokens[j]);
        j++;
      }
      out.push({ key: t, value: valueParts.join(" ").trim() });
      i = j;
    } else {
      i++;
    }
  }
  return out.filter(s => s.value);
}

export default async function PDP({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = loadProducts();
  const p = products.find(x => x.slug === slug);
  if (!p) notFound();
  const brandLabel = BRAND_LABEL[p.brand];
  const specs = extractSpecs(p.description);
  const related = products.filter(q => q.brand === p.brand && q.slug !== p.slug).slice(0, 4);

  return (
    <main className="max-w-[1440px] mx-auto pb-24">
      {/* Breadcrumbs */}
      <div className="px-8 py-6 font-label text-[11px] uppercase tracking-wide text-[#0A0A0A]/60">
        <Link href="/shop" className="hover:text-[#0A0A0A]">SHOP</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop/${p.brand}`} className="hover:text-[#0A0A0A]">{brandLabel}</Link>
        <span className="mx-2">/</span>
        <span className="text-[#0A0A0A]">{p.name.toUpperCase()}</span>
      </div>

      {/* PDP Main */}
      <section className="flex flex-col md:flex-row min-h-[700px] border-b border-[#0A0A0A]/15">
        {/* LEFT: images */}
        <div className="w-full md:w-1/2 p-8 flex flex-col gap-4">
          <div className="aspect-square bg-white w-full relative">
            <Image src={p.image_url} alt={p.name} fill priority className="object-contain p-8" />
          </div>
          <div className="flex gap-4 h-24">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={
                  i === 0
                    ? "w-24 h-24 bg-white border border-[#0A0A0A] p-2 cursor-pointer relative"
                    : "w-24 h-24 bg-white opacity-60 hover:opacity-100 transition-opacity p-2 cursor-pointer border border-transparent hover:border-[#0A0A0A]/20 relative"
                }
              >
                <Image src={p.image_url} alt="" fill className="object-contain p-1" />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: meta */}
        <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-20 flex flex-col justify-center">
          <span className="font-label text-sm uppercase tracking-widest text-[#0A0A0A]/60 mb-4 block">
            {brandLabel}
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
            {p.name.toUpperCase()}
          </h1>
          {p.price && <div className="text-2xl md:text-[28px] font-body font-medium mb-8">{p.price}</div>}

          {specs.length > 0 && (
            <div className="font-mono text-xs text-[#0A0A0A]/80 uppercase space-y-1 mb-10 border-l-2 border-[#0A0A0A] pl-4 py-1">
              {specs.map(s => (
                <div key={s.key}>
                  {s.key}: <span className="text-[#0A0A0A]">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <span className="font-label text-xs uppercase tracking-widest">SELECT SIZE (EU)</span>
              <a href="#" className="font-label text-[10px] uppercase tracking-widest text-[#0A0A0A]/60 hover:text-[#0A0A0A] underline">
                SIZE GUIDE
              </a>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[40, 41, 42, 43, 44, 45, 46].map((s, i) => (
                <button
                  key={s}
                  type="button"
                  className={
                    i === 2
                      ? "h-12 bg-[#0A0A0A] text-[#F7F7F4] font-body text-sm rounded-sm"
                      : i === 5
                      ? "h-12 border border-[#0A0A0A]/10 font-body text-sm text-[#0A0A0A]/30 line-through cursor-not-allowed rounded-sm"
                      : "h-12 border border-[#0A0A0A]/20 font-body text-sm hover:border-[#0A0A0A] transition-colors rounded-sm"
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <a
              href={p.source_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 h-14 bg-[#0A0A0A] text-[#F7F7F4] font-label uppercase tracking-wider text-xs hover:bg-[#FF3B00] transition-colors rounded-sm flex items-center justify-center"
            >
              ADD TO CART
            </a>
            <Link
              href={`/chat?q=${encodeURIComponent(`Tell me about ${p.name}`)}`}
              className="flex-1 h-14 border border-[#0A0A0A] text-[#0A0A0A] font-label uppercase tracking-wider text-xs hover:text-[#FF3B00] hover:border-[#FF3B00] transition-colors rounded-sm flex items-center justify-center"
            >
              ASK ABOUT THIS PAIR
            </Link>
          </div>

          <div className="font-body text-sm leading-relaxed text-[#0A0A0A]/80 max-w-lg">
            {p.description}
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="p-8 md:p-16 border-b border-[#0A0A0A]/15">
        <h2 className="font-display text-4xl font-black uppercase tracking-tighter mb-12">DETAILS</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="flex flex-col gap-6 justify-center">
            <div className="border border-[#0A0A0A]/10 p-6 bg-white/50 backdrop-blur-sm rounded-sm">
              <h3 className="font-label text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">layers</span> MATERIAL
              </h3>
              <p className="font-body text-sm text-[#0A0A0A]/70">
                Premium materials selected for durability and a structured, high-end feel.
              </p>
            </div>
            <div className="border border-[#0A0A0A]/10 p-6 bg-white/50 backdrop-blur-sm rounded-sm">
              <h3 className="font-label text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">public</span> SOURCING
              </h3>
              <p className="font-body text-sm text-[#0A0A0A]/70">
                Sourced through verified channels. Subject to rigorous quality control.
              </p>
            </div>
            <div className="border border-[#0A0A0A]/10 p-6 bg-white/50 backdrop-blur-sm rounded-sm">
              <h3 className="font-label text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">verified</span> AUTHENTICITY
              </h3>
              <p className="font-body text-sm text-[#0A0A0A]/70">
                100% authentic. Every pair is authenticated by our in-house specialists before listing.
              </p>
            </div>
          </div>
          <div className="h-[500px] bg-[#0A0A0A] rounded-sm overflow-hidden relative group">
            <Image
              src={p.image_url}
              alt=""
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="p-8 md:p-16">
          <h2 className="font-display text-4xl font-black uppercase tracking-tighter mb-12">
            YOU MIGHT ALSO LIKE
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {related.map(r => (
              <Link key={r.slug} href={`/product/${r.slug}`} className="group">
                <div className="aspect-square bg-white mb-4 p-6 relative flex items-center justify-center border border-transparent group-hover:border-[#0A0A0A]/10 transition-colors">
                  <Image
                    src={r.image_url}
                    alt={r.name}
                    fill
                    className="object-contain p-6 transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-display text-xl font-bold uppercase tracking-tight mb-1 group-hover:text-[#FF3B00] transition-colors">
                  {r.name.toUpperCase()}
                </h3>
                {r.price && <p className="font-body text-sm text-[#0A0A0A]/70">{r.price}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
```


## `app/services/page.tsx`

```tsx
import Link from "next/link";
import Image from "next/image";
import { loadKB } from "@/lib/catalog";

const SERVICE_IMAGE: Record<string, string> = {
  "svc-auth": "/images/services/authentication.jpg",
  "svc-consign": "/images/services/consignment.jpg",
  "svc-laundry": "/images/services/laundry.jpg",
  "svc-restoration": "/images/services/restoration.jpg",
  "svc-art": "/images/services/art.jpg",
  "svc-custom": "/images/services/custom.jpg",
  "svc-shipping": "/images/services/shipping.jpg",
  "svc-nikeid": "/images/services/nikeid.jpg",
};

export default function Services() {
  const services = loadKB().filter(c => c.type === "service");
  return (
    <main className="bg-[#F7F7F4] text-[#0A0A0A]">
      {/* Hero Band */}
      <section className="w-full min-h-[480px] flex flex-col md:flex-row border-b border-[#0A0A0A]/10 bg-[#F7F7F4]">
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-16 md:p-16 lg:p-24 border-b md:border-b-0 md:border-r border-[#0A0A0A]/10">
          <h1 className="font-headline text-6xl sm:text-7xl lg:text-8xl xl:text-[8rem] leading-[0.85] tracking-tighter text-[#0A0A0A] uppercase mb-8">
            MORE THAN<br />A SHOP
          </h1>
          <p className="font-body text-base text-[#0A0A0A]/80 max-w-md leading-relaxed">
            We are a sneaker boutique, an authentication desk, a restoration studio, and a custom-art atelier.
            Eight services, one roof, in Swefieh Village, Amman.
          </p>
        </div>
        <div className="w-full md:w-1/2 min-h-[400px] md:min-h-full relative overflow-hidden bg-[#e5e5e5]">
          <Image
            src="/images/services/hero.jpg"
            alt="Craftsman hands working on a sneaker"
            fill
            className="object-cover object-center mix-blend-multiply opacity-90"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </section>

      {/* Services Grid */}
      <section className="w-full max-w-[1600px] mx-auto p-6 md:p-12 lg:p-16 bg-[#F7F7F4]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(s => (
            <div
              key={s.id}
              className="group border border-[#0A0A0A]/20 bg-[#F7F7F4] p-8 min-h-[360px] flex flex-col hover:border-[#FF3B00] transition-colors duration-300"
            >
              <div className="w-full aspect-[4/5] mb-6 overflow-hidden bg-gray-100 relative">
                <Image
                  src={SERVICE_IMAGE[s.id] ?? "/images/services/authentication.jpg"}
                  alt={`${s.title} visual`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-auto">
                <h3 className="font-headline text-2xl uppercase text-[#0A0A0A] leading-tight mb-3">
                  {s.title}
                </h3>
                <p className="font-body text-[13px] text-[#0A0A0A]/70 leading-normal">{s.text}</p>
              </div>
              <span className="material-symbols-outlined text-sm self-end mt-6 text-[#0A0A0A]/30 group-hover:text-[#FF3B00] transition-colors duration-300">
                arrow_forward
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Strip */}
      <section className="w-full bg-[#0A0A0A] flex flex-col items-center justify-center py-20 px-6 text-center min-h-[240px]">
        <h2 className="font-headline text-5xl md:text-6xl text-[#F7F7F4] uppercase tracking-tighter leading-none mb-4">
          NEED SOMETHING SPECIFIC?
        </h2>
        <p className="font-body text-[#F7F7F4]/80 text-sm md:text-base mb-10">
          Talk to the assistant or visit us in store.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/chat"
            className="border border-[#F7F7F4] text-[#F7F7F4] bg-transparent hover:border-[#FF3B00] hover:text-[#FF3B00] transition-colors duration-300 font-label tracking-widest uppercase text-xs px-8 py-4 w-full sm:w-auto text-center"
          >
            ASK 8511
          </Link>
          <a
            href="https://maps.google.com/?cid=15121294295697539889"
            target="_blank"
            rel="noreferrer"
            className="bg-[#FF3B00] text-[#F7F7F4] border border-[#FF3B00] hover:bg-[#FF3B00]/90 transition-colors duration-300 font-label tracking-widest uppercase text-xs px-8 py-4 w-full sm:w-auto text-center"
          >
            VISIT STORE
          </a>
        </div>
      </section>
    </main>
  );
}
```


## `app/about/page.tsx`

```tsx
import { loadKB } from "@/lib/catalog";

export default function About() {
  const about = loadKB().find(c => c.id === "about")!;
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">ABOUT</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9] max-w-4xl">
        ADVOCATES OF THE SNEAKER STREETWEAR CULTURE.
      </h1>
      <div className="mt-16 grid md:grid-cols-2 gap-16 max-w-5xl">
        <p className="text-base leading-relaxed">{about.text}</p>
        <div className="font-label text-[11px] tracking-wider2 space-y-4 self-start">
          <div>
            <p className="text-muted">FOUNDED</p>
            <p className="text-ink mt-1 text-base font-body normal-case">2021</p>
          </div>
          <div>
            <p className="text-muted">LOCATION</p>
            <p className="text-ink mt-1 text-base font-body normal-case">Swefieh Village, Amman, Jordan</p>
          </div>
          <div>
            <p className="text-muted">FOCUS</p>
            <p className="text-ink mt-1 text-base font-body normal-case">
              Sneakers · Streetwear · Authentication · Restoration · Custom Art
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```


## `app/contact/page.tsx`

```tsx
export default function Contact() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">CONTACT</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">
        COME SAY HELLO.
      </h1>
      <div className="mt-16 grid md:grid-cols-3 gap-10 max-w-5xl font-label text-[11px] tracking-wider2">
        <div>
          <p className="text-muted">VISIT</p>
          <p className="mt-2 text-ink text-base font-body normal-case">
            Swefieh Village<br />Amman, Jordan
          </p>
          <a
            href="https://maps.google.com/?cid=15121294295697539889"
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-4 hover:text-accent"
          >
            OPEN IN GOOGLE MAPS →
          </a>
        </div>
        <div>
          <p className="text-muted">EMAIL</p>
          <a
            href="mailto:EightyFiveEleven.8511@gmail.com"
            className="block mt-2 text-ink text-base font-body normal-case hover:text-accent"
          >
            EightyFiveEleven.8511@gmail.com
          </a>
        </div>
        <div>
          <p className="text-muted">SOCIAL</p>
          <a
            href="https://www.instagram.com/eightyfiveeleven"
            target="_blank"
            rel="noreferrer"
            className="block mt-2 text-ink text-base font-body normal-case hover:text-accent"
          >
            @eightyfiveeleven
          </a>
        </div>
      </div>

      <div className="mt-20 border-t border-ink/15 pt-10 max-w-3xl">
        <p className="font-label text-[11px] tracking-wider2 text-muted">QUESTIONS?</p>
        <p className="mt-3 text-base text-ink/80 leading-relaxed">
          Ask the in-store assistant anytime — sizing, stock, services, or sneaker history.
          Trained on the entire 8511 catalog.
        </p>
        <a
          href="/chat"
          className="inline-block mt-6 bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors"
        >
          ASK 8511 →
        </a>
      </div>
    </div>
  );
}
```


## `app/chat/page.tsx`

```tsx
import ChatPanel from "@/components/chat/ChatPanel";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <main className="flex-grow">
      {/* Hero */}
      <section className="h-[240px] flex flex-col justify-center px-6 md:px-12 bg-[#F7F7F4]">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="font-headline text-6xl md:text-8xl tracking-tight leading-none mb-4">
            ASK 8511
          </h1>
          <p className="font-body text-base max-w-[60ch] text-[#0A0A0A]/80">
            Ask about products, services, sizing, store hours, or sneaker history.
          </p>
        </div>
      </section>

      {/* Main Layout — single column, full width inside max-w-7xl */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="border border-[#0A0A0A]/15 bg-[#F7F7F4] rounded-[4px] flex flex-col relative overflow-hidden">
            <ChatPanel initialQuestion={q} />
          </div>
        </div>
      </section>
    </main>
  );
}
```


## `components/layout/Header.tsx`

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/shop", label: "SHOP" },
  { href: "/services", label: "SERVICES" },
  { href: "/about", label: "ABOUT" },
  { href: "/contact", label: "CONTACT" },
  { href: "/chat", label: "ASK 8511" },
];

export default function Header() {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-10 w-full h-[80px] bg-surface border-b border-on-surface/15 transition-all">
      <Link href="/" className="flex items-center gap-2" aria-label="Eighty Five Eleven home">
        <span className="font-headline text-3xl font-black tracking-tighter text-on-surface">
          8511
        </span>
      </Link>
      <nav className="hidden md:flex items-center gap-8">
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`uppercase tracking-widest text-[12px] font-label hover:text-primary transition-colors duration-300 ${
              isActive(n.href) ? "text-on-surface" : "text-on-surface/70"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-6">
        <button className="text-on-surface hover:text-primary transition-colors duration-300 active:opacity-80">
          <span className="material-symbols-outlined">shopping_bag</span>
        </button>
        <button className="text-on-surface hover:text-primary transition-colors duration-300 active:opacity-80">
          <span className="material-symbols-outlined">person</span>
        </button>
      </div>
    </header>
  );
}
```


## `components/layout/Footer.tsx`

```tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full px-6 md:px-10 py-20 flex flex-col md:flex-row justify-between gap-12 bg-surface text-on-surface border-t border-on-surface/10">
      <div className="flex flex-col gap-6 w-full md:w-1/3">
        <h2 className="font-headline text-4xl uppercase tracking-tighter font-black text-on-surface">
          8511
        </h2>
        <p className="font-body text-sm tracking-normal text-on-surface/60">
          © {new Date().getFullYear()} 8511 AMMAN. ALL RIGHTS RESERVED.
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full md:w-1/3">
        <a
          href="https://www.instagram.com/eightyfiveeleven"
          target="_blank"
          rel="noreferrer"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          INSTAGRAM
        </a>
        <Link
          href="/services"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          SERVICES
        </Link>
        <Link
          href="/about"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          ABOUT
        </Link>
        <Link
          href="/contact"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          CONTACT
        </Link>
        <Link
          href="/chat"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          ASK 8511
        </Link>
      </div>
      <div className="flex flex-col gap-4 w-full md:w-1/3">
        <p className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60">INQUIRIES</p>
        <a
          href="mailto:EightyFiveEleven.8511@gmail.com"
          className="font-body text-sm text-on-surface hover:text-primary transition-colors break-all"
        >
          EightyFiveEleven.8511@gmail.com
        </a>
        <a
          href="https://www.instagram.com/eightyfiveeleven"
          target="_blank"
          rel="noreferrer"
          className="font-body text-sm text-on-surface hover:text-primary transition-colors"
        >
          @eightyfiveeleven
        </a>
      </div>
    </footer>
  );
}
```


## `components/layout/BrandMarquee.tsx`

```tsx
function NikeSwoosh({ className = "h-[60px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} fill="currentColor" aria-label="Nike">
      <path d="M9.156 13.184L1.46 16.06c-.66.244-1.226.366-1.682.366-.523 0-.918-.166-1.18-.502-.252-.32-.327-.748-.21-1.222.114-.46.412-.978.876-1.524.36-.42.93-1.013 1.704-1.778l-.04-.026c-.41.244-.78.394-1.04.422-.272.028-.466-.06-.572-.262-.106-.198-.122-.466-.05-.798.072-.34.244-.752.51-1.232.354-.64.928-1.546 1.726-2.726L24 0 9.156 13.184z" />
    </svg>
  );
}

function AdidasTrefoil({ className = "h-[60px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} fill="currentColor" aria-label="Adidas">
      <polygon points="0,60 22,21 50,60" />
      <polygon points="28,60 50,21 78,60" />
      <polygon points="56,60 78,21 100,60" />
    </svg>
  );
}

function SupremeBox({ className = "h-[60px]" }: { className?: string }) {
  return (
    <div className={`bg-[#09090b] px-6 py-2 ${className} flex items-center`}>
      <span className="text-white font-black italic text-4xl tracking-tighter">Supreme</span>
    </div>
  );
}

function HatIcon({ className = "h-[60px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} fill="currentColor" aria-label="Hats">
      <path d="M2 26 C 2 24, 8 18, 24 18 L 40 18 C 56 18, 62 24, 62 26 L 62 30 L 2 30 Z" />
      <path d="M22 18 C 22 8, 30 4, 36 4 C 44 4, 52 10, 52 18 Z" />
    </svg>
  );
}

function LogoSet() {
  return (
    <div className="flex items-center gap-[120px] px-[60px] text-on-surface">
      <NikeSwoosh />
      <AdidasTrefoil />
      <SupremeBox />
      <HatIcon />
    </div>
  );
}

export default function BrandMarquee() {
  return (
    <div className="animate-marquee flex items-center">
      <LogoSet />
      <LogoSet />
      <LogoSet />
      <LogoSet />
    </div>
  );
}
```


## `components/chat/ChatPanel.tsx`

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ProductCard from "./ProductCard";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTED = [
  "WHAT YEEZYS DO YOU HAVE?",
  "TELL ME ABOUT CONSIGNMENT",
  "STORE HOURS?",
  "DO YOU SHIP TO RIYADH?",
];

function SneakerIcon({ thinking }: { thinking: boolean }) {
  return (
    <Image
      src="/sneaker-icon.png"
      alt=""
      width={56}
      height={56}
      className={`w-14 h-14 object-contain mix-blend-multiply ${thinking ? "animate-sneaker-spin" : "animate-sneaker-pulse"}`}
    />
  );
}

function renderAssistant(text: string) {
  const parts = text.split(/(<product\s+slug="[^"]+"\s*\/>)/g);
  const cards: { slug: string }[] = [];
  const textParts: string[] = [];
  for (const part of parts) {
    const m = part.match(/<product\s+slug="([^"]+)"\s*\/>/);
    if (m) cards.push({ slug: m[1] });
    else if (part) textParts.push(part);
  }
  return (
    <>
      <div className="font-body text-[15px] max-w-[80%] mb-4 whitespace-pre-wrap">{textParts.join("")}</div>
      {cards.length > 0 && (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <ProductCard key={i} slug={c.slug} />
          ))}
        </div>
      )}
    </>
  );
}

export default function ChatPanel({
  compact = false,
  initialQuestion,
}: {
  compact?: boolean;
  initialQuestion?: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const initialFiredRef = useRef(false);

  async function send(forced?: string) {
    const q = (forced ?? input).trim();
    if (!q || busy) return;
    if (!forced) setInput("");
    const prior = msgs;
    setMsgs(m => [...m, { role: "user", text: q }, { role: "assistant", text: "" }]);
    setBusy(true);
    try {
      const history = prior.map(m => `${m.role}: ${m.text}`).join("\n");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMsgs(m => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: copy[copy.length - 1].text + chunk };
          return copy;
        });
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialQuestion && !initialFiredRef.current) {
      initialFiredRef.current = true;
      send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const lastIdx = msgs.length - 1;

  return (
    <>
      {/* LIVE tag */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 font-label text-[10px] tracking-widest uppercase bg-[#F7F7F4] border border-[#0A0A0A]/10 px-2 py-1 rounded-[2px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B00]" /> LIVE
      </div>

      {/* Convo */}
      <div className={`flex-grow overflow-y-auto p-8 pt-16 flex flex-col gap-8 ${compact ? "max-h-[420px]" : ""}`}>
        {msgs.length === 0 && (
          <p className="text-[#0A0A0A]/60 text-sm">
            Ask about a sneaker, a service, or the store.
          </p>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex flex-col gap-1 items-end">
              <span className="font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60">YOU</span>
              <div className="font-body text-[15px] max-w-[80%] text-right">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="flex flex-col gap-1 items-start">
              <span className="flex items-center">
                <SneakerIcon thinking={busy && i === lastIdx} />
              </span>
              {/* If still streaming and no text yet, show loading dot row */}
              {busy && i === lastIdx && !m.text ? (
                <div className="font-body text-[15px] text-[#0A0A0A]/40 mt-2">Thinking…</div>
              ) : (
                renderAssistant(m.text)
              )}
            </div>
          )
        )}
        <div ref={endRef} />

        {/* Suggested chips */}
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-[#0A0A0A]/10">
            {SUGGESTED.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={busy}
                className="font-label text-[10px] tracking-widest uppercase border border-[#0A0A0A]/20 px-3 py-1.5 rounded-[2px] hover:border-[#0A0A0A] hover:text-[#FF3B00] transition-colors bg-white disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={e => {
          e.preventDefault();
          send();
        }}
        className="border-t border-[#0A0A0A]/15 bg-white p-4"
      >
        <div className="flex items-center gap-4 mb-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask 8511..."
            className="flex-grow bg-transparent border-none outline-none focus:ring-0 font-body text-base placeholder:text-[#0A0A0A]/40"
          />
          <button
            disabled={busy || !input.trim()}
            className="bg-[#0A0A0A] text-[#F7F7F4] font-label text-xs tracking-wider uppercase px-6 py-3 rounded-[4px] hover:bg-[#FF3B00] transition-colors flex items-center gap-2 disabled:opacity-40"
          >
            SEND <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
          </button>
        </div>
        <p className="font-body text-[10px] text-[#0A0A0A]/40 text-center uppercase tracking-wider">
          Answers are grounded in the 8511 catalog. Verify in-store for stock.
        </p>
      </form>
    </>
  );
}
```


## `components/chat/ChatWidget.tsx`

```tsx
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Hide widget on the dedicated /chat page (we ARE the chat there).
  if (pathname?.startsWith("/chat")) return null;
  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 bg-accent text-paper rounded-full px-6 py-3.5 shadow-xl z-40 font-label text-[11px] tracking-wider2 hover:bg-ink transition-colors flex items-center gap-2"
      >
        {open ? (
          <>CLOSE ✕</>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse" />
            ASK 8511
          </>
        )}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-[400px] max-w-[92vw] bg-paper border border-ink/20 shadow-2xl overflow-hidden z-40">
          <ChatPanel compact />
        </div>
      )}
    </>
  );
}
```


## `components/chat/ProductCard.tsx`

```tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog";

const BRAND_LABEL: Record<string, string> = {
  nike: "NIKE",
  adidas: "ADIDAS",
  supreme: "SUPREME",
  hats: "HATS",
};

let cache: Product[] | null = null;
async function getProducts(): Promise<Product[]> {
  if (cache) return cache;
  const res = await fetch("/api/products");
  cache = await res.json();
  return cache!;
}

export default function ProductCard({ slug }: { slug: string }) {
  const [p, setP] = useState<Product | null>(null);
  useEffect(() => {
    getProducts().then(list => setP(list.find(x => x.slug === slug) ?? null));
  }, [slug]);
  if (!p) return null;
  return (
    <Link
      href={`/product/${p.slug}`}
      className="border border-[#0A0A0A]/10 p-3 group cursor-pointer hover:border-[#0A0A0A] transition-colors block"
    >
      <div className="bg-white aspect-square mb-3 flex items-center justify-center border border-[#0A0A0A]/5 relative">
        <Image src={p.image_url} alt={p.name} fill className="object-contain p-3" />
      </div>
      <div className="font-label text-[10px] tracking-widest text-[#0A0A0A]/60 mb-1">
        {BRAND_LABEL[p.brand]}
      </div>
      <div className="font-display font-bold text-sm uppercase leading-tight mb-2">{p.name}</div>
      <div className="flex justify-between items-end">
        <div className="font-body text-xs">{p.price ?? ""}</div>
        <div className="font-label text-[10px] tracking-widest text-[#FF3B00] opacity-0 group-hover:opacity-100 transition-opacity">
          VIEW →
        </div>
      </div>
    </Link>
  );
}
```


## `lib/catalog.ts`

```tsx
import { z } from "zod";
import fs from "node:fs";

export const ProductSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.enum(["nike", "adidas", "supreme", "hats"]),
  price: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  image_url: z.string(),
  source_url: z.string(),
  description: z.string(),
});
export type Product = z.infer<typeof ProductSchema>;

export const KBChunkSchema = z.object({
  id: z.string(),
  type: z.enum(["service", "about", "store", "contact"]),
  title: z.string(),
  text: z.string(),
});
export type KBChunk = z.infer<typeof KBChunkSchema>;

export function loadProducts(file = "data/products.json"): Product[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return z.array(ProductSchema).parse(raw);
}

export function loadKB(file = "data/kb.json"): KBChunk[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return z.array(KBChunkSchema).parse(raw);
}
```


## `data/kb.json`

```json
[
  { "id": "about", "type": "about", "title": "About Eighty Five Eleven",
    "text": "Eighty Five Eleven is a streetwear and sneaker boutique in Swefieh Village, Amman, Jordan. Established in 2021. Advocates of the sneaker streetwear culture, bridging humans and sneaker streetwear culture under one roof." },
  { "id": "store", "type": "store", "title": "Store location",
    "text": "Visit our store in Swefieh Village, Amman, Jordan. Find us on Google Maps." },
  { "id": "contact", "type": "contact", "title": "Contact",
    "text": "Email EightyFiveEleven.8511@gmail.com. Address: Saleh Ali Zaki, Amman, Jordan. Instagram: @eightyfiveeleven." },
  { "id": "svc-auth", "type": "service", "title": "Sneaker Authentication",
    "text": "Verify the authenticity of any sneaker before you buy or sell." },
  { "id": "svc-consign", "type": "service", "title": "Sneaker Consignment",
    "text": "Consign your sneakers with us — we list, sell, and pay you out." },
  { "id": "svc-laundry", "type": "service", "title": "Sneaker Laundry",
    "text": "Professional cleaning service for sneakers." },
  { "id": "svc-restoration", "type": "service", "title": "Sneaker Restoration",
    "text": "Bring tired pairs back to life — sole swaps, color restoration, repairs." },
  { "id": "svc-art", "type": "service", "title": "Custom Sneaker Art",
    "text": "Hand-painted custom artwork on your sneakers." },
  { "id": "svc-custom", "type": "service", "title": "Custom Orders",
    "text": "Custom orders for shoes and clothing of your preference." },
  { "id": "svc-shipping", "type": "service", "title": "Worldwide Shipping",
    "text": "We ship globally." },
  { "id": "svc-nikeid", "type": "service", "title": "Nike ID",
    "text": "Nike ID custom design service." }
]
```


## `next.config.ts`

```tsx
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["faiss-node", "@langchain/community"],
};

export default nextConfig;
```


## `package.json`

```json
{
  "name": "eighty-five-eleven",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "ingest": "tsx scripts/ingest.ts",
    "embed": "tsx scripts/embed.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@google/genai": "^2.0.0",
    "@huggingface/inference": "^4.13.15",
    "@langchain/community": "^1.1.28",
    "@langchain/core": "^1.1.45",
    "dotenv": "^17.4.2",
    "faiss-node": "^0.5.1",
    "langchain": "^1.4.0",
    "next": "15.5.18",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitest/ui": "^4.1.5",
    "eslint": "^9",
    "eslint-config-next": "15.5.18",
    "tailwindcss": "^4",
    "tsx": "^4.21.0",
    "typescript": "^5",
    "vitest": "^4.1.5"
  }
}
```

