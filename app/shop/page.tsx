import Link from "next/link";
import Image from "next/image";
import { loadProducts } from "@/lib/catalog";

export default function Shop() {
  const products = loadProducts();
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl mb-8">Shop</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map(p => (
          <Link key={p.slug} href={`/product/${p.slug}`} className="block border border-line/20 hover:border-accent transition-colors">
            <div className="aspect-square relative bg-white"><Image src={p.image_url} alt={p.name} fill className="object-contain" /></div>
            <div className="p-3 font-display tracking-wider2 text-sm">{p.name}</div>
            {p.price && <div className="px-3 pb-3 text-xs text-muted">{p.price}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
