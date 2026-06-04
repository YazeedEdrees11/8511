"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { deleteProduct } from "@/app/actions/admin";

interface ProductVariant {
  id: number;
  sizeEu: string;
  stock: number;
}

interface Product {
  id: number;
  slug: string;
  name: string;
  brand: {
    id: number;
    name: string;
    slug: string;
  };
  basePrice: number | null;
  variants: ProductVariant[];
  imageUrl: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
  brands: { id: number; name: string; slug: string }[];
}

export default function ProductsClient({ initialProducts, brands }: ProductsClientProps) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [brandFilter, setBrandFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = brandFilter === "" || p.brand.slug === brandFilter;
    return matchesSearch && matchesBrand;
  });

  async function handleDelete(id: number) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        setDeletingId(null);
      } else {
        alert(res.error || "Failed to delete product.");
      }
    } catch {
      alert("An unexpected error occurred while deleting.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8 md:p-12 flex-grow flex flex-col gap-8 bg-[#F9F9F9]">
      {/* Page Header Title & Action */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <h1 className="font-display text-6xl md:text-7xl font-black uppercase tracking-tighter text-[#0A0A0A] leading-[0.85] flex flex-col">
          <span>PRODUCT</span>
          <span>MANAGEMENT</span>
        </h1>

        <div className="flex items-center gap-4">
          {/* Search bar inside header row */}
          <div className="relative w-64 md:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[#999999] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, SKUs..."
              className="w-full bg-white border border-[#E5E5E5] pl-10 pr-4 py-3 text-xs focus:border-[#0A0A0A] focus:outline-none transition-colors rounded-none text-[#0A0A0A]"
            />
          </div>

          <Link
            href="/products/new"
            className="bg-[#0A0A0A] text-white hover:bg-[#222222] font-label text-xs tracking-wider uppercase px-6 py-3.5 transition-all rounded-none flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            ADD NEW PRODUCT
          </Link>
        </div>
      </div>

      {/* Brand Filter Pill Bar */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-4 border border-[#E5E5E5]">
        <span className="font-label text-[10px] tracking-[0.1em] uppercase font-semibold text-[#888888] mr-2">
          Filter Brand:
        </span>
        <button
          onClick={() => setBrandFilter("")}
          className={`font-label text-[10px] tracking-wider uppercase px-3 py-1.5 transition-colors font-semibold ${
            brandFilter === "" 
              ? "bg-[#0A0A0A] text-white" 
              : "bg-[#FAFAFA] border border-[#E5E5E5] text-[#555555] hover:bg-[#FAFAFA]"
          }`}
        >
          All
        </button>
        {brands.map(b => (
          <button
            key={b.id}
            onClick={() => setBrandFilter(b.slug)}
            className={`font-label text-[10px] tracking-wider uppercase px-3 py-1.5 transition-colors font-semibold ${
              brandFilter === b.slug 
                ? "bg-[#0A0A0A] text-white" 
                : "bg-[#FAFAFA] border border-[#E5E5E5] text-[#555555] hover:bg-[#FAFAFA]"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Products Table Card */}
      <div className="bg-white border border-[#E5E5E5] rounded-none overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-[#E5E5E5] font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
                <th className="px-8 py-5 w-[120px]">IMAGE</th>
                <th className="px-8 py-5">PRODUCT NAME</th>
                <th className="px-8 py-5">BRAND</th>
                <th className="px-8 py-5">CATEGORY</th>
                <th className="px-8 py-5">PRICE</th>
                <th className="px-8 py-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-[#999999] font-body text-sm">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                    {/* Image Column */}
                    <td className="px-8 py-4">
                      <div className="w-[72px] h-[72px] bg-white border border-[#E5E5E5] relative overflow-hidden flex items-center justify-center p-1">
                        <Image
                          src={p.imageUrl || "/images/products/placeholder.jpg"}
                          alt={p.name}
                          fill
                          className="object-contain p-1"
                          sizes="72px"
                        />
                      </div>
                    </td>

                    {/* Product Name & Variants Stock Summary */}
                    <td className="px-8 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-display text-[15px] font-bold text-[#0A0A0A] hover:text-[#c8ff00] transition-colors block">
                          {p.name}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {p.variants.map(v => (
                            <span 
                              key={v.id} 
                              className={`font-mono text-[9px] px-1.5 py-0.5 border ${
                                v.stock === 0 
                                  ? "bg-red-50 border-red-200 text-red-600" 
                                  : v.stock <= 2
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-[#FAFAFA] border-[#E5E5E5] text-[#555555]"
                              }`}
                            >
                              {v.sizeEu} ({v.stock})
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Brand Badge */}
                    <td className="px-8 py-4">
                      <span className="inline-block bg-[#0A0A0A] text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        {p.brand.name}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-8 py-4 font-label text-[13px] text-[#555555]">
                      {p.slug.includes("hoodie") || p.slug.includes("cap") || p.slug.includes("tee")
                        ? "Apparel" 
                        : p.slug.includes("crossbody") || p.slug.includes("bag")
                          ? "Accessories"
                          : "Footwear"}
                    </td>

                    {/* Price */}
                    <td className="px-8 py-4 font-display text-[15px] font-black text-[#0A0A0A]">
                      {p.basePrice ? `$${Number(p.basePrice).toFixed(2)}` : "—"}
                    </td>

                    {/* Action buttons */}
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] px-3.5 py-2 font-label text-[10px] tracking-wider uppercase transition-colors rounded-none flex items-center gap-1 font-semibold"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          EDIT
                        </Link>

                        {deletingId === p.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={busy}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 font-label text-[10px] tracking-wider uppercase rounded-none font-semibold disabled:opacity-50"
                            >
                              CONFIRM
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="border border-[#E5E5E5] hover:bg-gray-50 text-[#555555] px-3 py-2 font-label text-[10px] tracking-wider uppercase rounded-none"
                            >
                              CANCEL
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(p.id)}
                            className="border border-[#E5E5E5] hover:border-red-600 text-red-600 hover:bg-red-50 px-3.5 py-2 font-label text-[10px] tracking-wider uppercase transition-colors rounded-none flex items-center gap-1 font-semibold"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            DELETE
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination Info */}
        <div className="border-t border-[#E5E5E5] px-8 py-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 font-label text-xs">
          <span className="text-[#888888]">
            Showing 1 to {filteredProducts.length} of {filteredProducts.length} results
          </span>

          <div className="flex items-center gap-1">
            <button className="border border-[#E5E5E5] text-[#888888] px-3 py-1.5 rounded-none font-semibold cursor-not-allowed hover:bg-white transition-all">
              &lt;
            </button>
            <button className="bg-[#0A0A0A] text-white px-3 py-1.5 rounded-none font-semibold">
              1
            </button>
            <button className="border border-[#E5E5E5] text-[#888888] px-3 py-1.5 rounded-none font-semibold cursor-not-allowed hover:bg-white transition-all">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
