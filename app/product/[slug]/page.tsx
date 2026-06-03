import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, loadProducts } from "@/lib/catalog";
import AddToCartButton from "@/components/cart/AddToCartButton";

export const dynamic = "force-dynamic";

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
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const brandLabel = BRAND_LABEL[p.brand.slug];
  const specs = extractSpecs(p.description);
  const all = await loadProducts();
  const related = all.filter(q => q.brand.slug === p.brand.slug && q.slug !== p.slug).slice(0, 4);
  const price = p.basePrice ? `${p.basePrice.toString()} JOD` : null;

  return (
    <main className="max-w-[1440px] mx-auto pb-24">
      {/* Breadcrumbs */}
      <div className="px-8 py-6 font-label text-[11px] uppercase tracking-wide text-[#0A0A0A]/60">
        <Link href="/shop" className="hover:text-[#0A0A0A]">SHOP</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop/${p.brand.slug}`} className="hover:text-[#0A0A0A]">{brandLabel}</Link>
        <span className="mx-2">/</span>
        <span className="text-[#0A0A0A]">{p.name.toUpperCase()}</span>
      </div>

      {/* PDP Main */}
      <section className="flex flex-col md:flex-row min-h-[700px] border-b border-[#0A0A0A]/15">
        {/* LEFT: images */}
        <div className="w-full md:w-1/2 p-8 flex flex-col gap-4">
          <div className="aspect-square bg-white w-full relative">
            <Image src={p.imageUrl} alt={p.name} fill priority className="object-contain p-8" />
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
                <Image src={p.imageUrl} alt="" fill className="object-contain p-1" />
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
          {price && <div className="text-2xl md:text-[28px] font-body font-medium mb-8">{price}</div>}

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
              {p.variants.map((v, i) => {
                const soldOut = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={soldOut}
                    className={
                      soldOut
                        ? "h-12 border border-[#0A0A0A]/10 font-body text-sm text-[#0A0A0A]/30 line-through cursor-not-allowed rounded-sm"
                        : i === 0
                        ? "h-12 bg-[#0A0A0A] text-[#F7F7F4] font-body text-sm rounded-sm"
                        : "h-12 border border-[#0A0A0A]/20 font-body text-sm hover:border-[#0A0A0A] transition-colors rounded-sm"
                    }
                  >
                    {v.sizeEu}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <AddToCartButton
              productId={p.id}
              defaultVariantId={p.variants.find(v => v.stock > 0)?.id}
            />
            <Link
              href={`/chat?q=${encodeURIComponent(`Tell me about ${p.name}`)}`}
              className="flex-1 h-14 border border-[#0A0A0A] text-[#0A0A0A] font-label uppercase tracking-wider text-xs hover:text-primary hover:border-primary transition-colors rounded-sm flex items-center justify-center"
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
              src={p.imageUrl}
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
                    src={r.imageUrl}
                    alt={r.name}
                    fill
                    className="object-contain p-6 transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-display text-xl font-bold uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">
                  {r.name.toUpperCase()}
                </h3>
                {r.basePrice && <p className="font-body text-sm text-[#0A0A0A]/70">{r.basePrice.toString()} JOD</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
