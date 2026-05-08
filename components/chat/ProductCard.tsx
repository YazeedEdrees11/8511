"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog";

let cache: Product[] | null = null;
async function getProducts(): Promise<Product[]> {
  if (cache) return cache;
  const res = await fetch("/api/products");
  cache = await res.json();
  return cache!;
}

export default function ProductCard({ slug }: { slug: string }) {
  const [p, setP] = useState<Product | null>(null);
  useEffect(() => { getProducts().then(list => setP(list.find(x => x.slug === slug) ?? null)); }, [slug]);
  if (!p) return null;
  return (
    <Link href={`/product/${p.slug}`} className="block border border-line/20 rounded p-3 hover:border-accent transition-colors max-w-xs">
      <div className="aspect-square relative bg-white">
        <Image src={p.image_url} alt={p.name} fill className="object-contain" />
      </div>
      <div className="mt-2 font-display tracking-wider2 text-sm">{p.name}</div>
      {p.price && <div className="text-xs text-muted">{p.price}</div>}
    </Link>
  );
}
