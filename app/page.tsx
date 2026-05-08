import Link from "next/link";
import Image from "next/image";
import { loadProducts } from "@/lib/catalog";

export default function Home() {
  const featured = loadProducts().slice(0, 6);
  return (
    <div>
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="font-display text-5xl md:text-7xl tracking-tight">Eighty Five Eleven</h1>
        <p className="mt-4 text-muted max-w-xl">Advocates of the sneaker streetwear culture. Swefieh Village, Amman.</p>
        <Link href="/shop" className="inline-block mt-8 px-6 py-3 bg-ink text-paper text-sm tracking-wider2 uppercase">Shop now</Link>
      </section>
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["nike","adidas","supreme","hats"] as const).map(b => (
          <Link key={b} href={`/shop/${b}`} className="border border-line/20 px-4 py-10 text-center font-display uppercase tracking-wider2 hover:border-accent transition-colors">{b}</Link>
        ))}
      </section>
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl mb-8">Featured</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {featured.map(p => (
            <Link key={p.slug} href={`/product/${p.slug}`} className="block border border-line/20 hover:border-accent transition-colors">
              <div className="aspect-square relative bg-white"><Image src={p.image_url} alt={p.name} fill className="object-contain" /></div>
              <div className="p-3 font-display tracking-wider2 text-sm">{p.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
