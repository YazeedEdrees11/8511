"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
type Product = {
  slug: string;
  name: string;
  brand: "nike" | "adidas" | "supreme" | "hats";
  price?: string;
  image_url: string;
  source_url: string;
  description: string;
};

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
        <div className="font-label text-[10px] tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          VIEW →
        </div>
      </div>
    </Link>
  );
}
