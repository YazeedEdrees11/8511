import Image from "next/image";
import { notFound } from "next/navigation";
import { loadProducts } from "@/lib/catalog";

export default async function PDP({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = loadProducts().find(x => x.slug === slug);
  if (!p) notFound();
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
      <div className="aspect-square relative bg-white border border-line/20"><Image src={p.image_url} alt={p.name} fill className="object-contain" /></div>
      <div>
        <h1 className="font-display text-4xl">{p.name}</h1>
        <div className="mt-2 text-muted uppercase tracking-wider2 text-xs">{p.brand}</div>
        {p.price && <div className="mt-4 text-2xl">{p.price}</div>}
        <p className="mt-6 leading-relaxed text-sm">{p.description}</p>
        <a href={p.source_url} target="_blank" className="inline-block mt-8 px-6 py-3 bg-ink text-paper text-sm uppercase tracking-wider2">Buy on 8511</a>
      </div>
    </div>
  );
}
