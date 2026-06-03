"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  basePrice: any; // Decimal
  variants: ProductVariant[];
  imageUrl: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
  brands: { id: number; name: string; slug: string }[];
}

export default function ProductsClient({ initialProducts, brands }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Statistics
  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.variants.every(v => v.stock === 0)).length;
  const lowStockCount = products.filter(p => p.variants.some(v => v.stock > 0 && v.stock <= 2)).length;
  const totalStock = products.reduce((sum, p) => sum + p.variants.reduce((s, v) => s + v.stock, 0), 0);

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
    <div className="p-6 md:p-10 space-y-8 flex-grow">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-label text-[10px] tracking-widest text-[#0A0A0A]/60 uppercase">BACKOFFICE</span>
          <h1 className="font-display text-5xl uppercase tracking-tighter mt-1">PRODUCT CATALOG</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-[#0A0A0A] text-[#F7F7F4] hover:bg-primary hover:text-[#0A0A0A] font-label text-xs tracking-widest uppercase px-6 py-4 transition-all rounded-sm flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span> ADD NEW PRODUCT
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161616] text-[#F7F7F4] p-6 rounded-sm border border-[#F7F7F4]/5">
          <span className="font-label text-[9px] tracking-widest uppercase text-[#F7F7F4]/50">TOTAL PRODUCTS</span>
          <div className="font-display text-4xl mt-2">{totalProducts}</div>
        </div>

        <div className="bg-[#161616] text-[#F7F7F4] p-6 rounded-sm border border-[#F7F7F4]/5">
          <span className="font-label text-[9px] tracking-widest uppercase text-[#F7F7F4]/50">TOTAL STOCK</span>
          <div className="font-display text-4xl mt-2">{totalStock} UNITS</div>
        </div>

        <div className="bg-[#161616] text-[#F7F7F4] p-6 rounded-sm border border-[#F7F7F4]/5">
          <span className="font-label text-[9px] tracking-widest uppercase text-[#F7F7F4]/50">OUT OF STOCK</span>
          <div className="font-display text-4xl mt-2 text-red-500">{outOfStockCount}</div>
        </div>

        <div className="bg-[#161616] text-[#F7F7F4] p-6 rounded-sm border border-primary/20">
          <span className="font-label text-[9px] tracking-widest uppercase text-primary">LOW STOCK ALERTS</span>
          <div className="font-display text-4xl mt-2 text-primary">{lowStockCount}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-[#0A0A0A]/10 rounded-sm">
        <div className="flex-grow relative">
          <span className="material-symbols-outlined absolute left-3 top-3.5 text-[#0A0A0A]/40 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name or slug..."
            className="w-full bg-[#F7F7F4] border border-[#0A0A0A]/10 pl-10 pr-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A]"
          />
        </div>
        <select
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
          className="bg-[#F7F7F4] border border-[#0A0A0A]/10 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A] min-w-[180px] font-label uppercase tracking-wider text-xs"
        >
          <option value="">ALL BRANDS</option>
          {brands.map(b => (
            <option key={b.id} value={b.slug}>
              {b.name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#0A0A0A]/10 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0A] text-[#F7F7F4] font-label text-[10px] tracking-widest uppercase">
                <th className="px-6 py-4">IMAGE</th>
                <th className="px-6 py-4">BRAND & NAME</th>
                <th className="px-6 py-4">SLUG</th>
                <th className="px-6 py-4">PRICE</th>
                <th className="px-6 py-4">VARIANTS & STOCK</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A0A0A]/10">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#0A0A0A]/50 font-body text-sm">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-[#F7F7F4]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-14 h-14 bg-[#F7F7F4] border border-[#0A0A0A]/5 relative rounded-sm overflow-hidden flex items-center justify-center p-1">
                        <Image
                          src={p.imageUrl || "/images/products/placeholder.jpg"}
                          alt={p.name}
                          fill
                          className="object-contain"
                          sizes="56px"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-label text-[9px] tracking-widest text-[#0A0A0A]/60 uppercase block">
                        {p.brand.name}
                      </span>
                      <span className="font-headline text-lg uppercase tracking-tight text-[#0A0A0A]">
                        {p.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#0A0A0A]/70">
                      {p.slug}
                    </td>
                    <td className="px-6 py-4 font-body text-sm font-semibold">
                      {p.basePrice ? `${Number(p.basePrice).toFixed(2)} JOD` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {p.variants.map(v => {
                          let stockCls = "bg-[#0A0A0A]/5 text-[#0A0A0A]/80 border-[#0A0A0A]/10";
                          if (v.stock === 0) stockCls = "bg-red-500/10 text-red-600 border-red-500/20";
                          else if (v.stock <= 2) stockCls = "bg-amber-500/10 text-amber-700 border-amber-500/20";

                          return (
                            <span
                              key={v.id}
                              className={`font-mono text-[10px] px-2 py-0.5 border rounded-[2px] flex items-center gap-1 ${stockCls}`}
                            >
                              <span>{v.sizeEu}</span>
                              <span className="opacity-50">|</span>
                              <span className="font-bold">{v.stock}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="border border-[#0A0A0A]/10 bg-white hover:border-[#0A0A0A] px-3.5 py-2 font-label text-[10px] tracking-widest uppercase transition-colors rounded-sm flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span> EDIT
                        </Link>
                        {deletingId === p.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={busy}
                              className="bg-red-600 text-white hover:bg-red-700 px-3.5 py-2 font-label text-[10px] tracking-widest uppercase rounded-sm disabled:opacity-50"
                            >
                              CONFIRM
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="border border-[#0A0A0A]/10 hover:bg-[#0A0A0A]/5 px-3.5 py-2 font-label text-[10px] tracking-widest uppercase rounded-sm"
                            >
                              CANCEL
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(p.id)}
                            className="border border-red-500/20 bg-white hover:bg-red-500/10 hover:border-red-500 text-red-600 px-3.5 py-2 font-label text-[10px] tracking-widest uppercase transition-colors rounded-sm flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">delete</span> DELETE
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
      </div>
    </div>
  );
}
