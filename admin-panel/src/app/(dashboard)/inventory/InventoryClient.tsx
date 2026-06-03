"use client";

import { useState } from "react";
import Image from "next/image";
import { updateVariantStock } from "@/app/actions/admin";

interface VariantWithProduct {
  id: number;
  sizeEu: string;
  sku: string;
  stock: number;
  product: {
    id: number;
    name: string;
    imageUrl: string;
    brand: {
      name: string;
    };
  };
}

interface InventoryClientProps {
  initialVariants: VariantWithProduct[];
}

export default function InventoryClient({ initialVariants }: InventoryClientProps) {
  const [variants, setVariants] = useState<VariantWithProduct[]>(initialVariants);
  const [search, setSearch] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [typedStocks, setTypedStocks] = useState<{ [id: number]: string }>({});

  async function adjustStock(variantId: number, currentStock: number, delta: number) {
    if (updatingId !== null) return;
    const newStock = Math.max(0, currentStock + delta);
    setUpdatingId(variantId);

    try {
      const res = await updateVariantStock(variantId, newStock);
      if (res.success) {
        setVariants(prev =>
          prev.map(v => (v.id === variantId ? { ...v, stock: res.newStock } : v))
        );
      } else {
        alert("Failed to update stock.");
      }
    } catch {
      alert("Error occurred while updating stock.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveTypedStock(variantId: number) {
    const rawVal = typedStocks[variantId];
    if (rawVal === undefined || rawVal.trim() === "") return;
    const newStock = parseInt(rawVal);
    if (isNaN(newStock) || newStock < 0) {
      alert("Please enter a valid stock number.");
      return;
    }

    setUpdatingId(variantId);
    try {
      const res = await updateVariantStock(variantId, newStock);
      if (res.success) {
        setVariants(prev =>
          prev.map(v => (v.id === variantId ? { ...v, stock: res.newStock } : v))
        );
        // Clear input
        setTypedStocks(prev => {
          const next = { ...prev };
          delete next[variantId];
          return next;
        });
      } else {
        alert("Failed to update stock.");
      }
    } catch {
      alert("Error occurred while updating stock.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Statistics
  const totalSkuCount = variants.length;
  const outOfStockSkuCount = variants.filter(v => v.stock === 0).length;
  const lowStockSkuCount = variants.filter(v => v.stock > 0 && v.stock <= 2).length;
  const totalUnits = variants.reduce((sum, v) => sum + v.stock, 0);

  // Filters
  const filteredVariants = variants.filter(v => {
    const matchesSearch =
      v.product.name.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = !showLowStockOnly || v.stock <= 2;
    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="p-6 md:p-10 space-y-8 flex-grow">
      {/* Header */}
      <div>
        <span className="font-label text-[10px] tracking-widest text-[#0A0A0A]/60 uppercase">BACKOFFICE</span>
        <h1 className="font-display text-5xl uppercase tracking-tighter mt-1">INVENTORY & CAPACITY</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161616] text-[#F7F7F4] p-6 rounded-sm border border-[#F7F7F4]/5">
          <span className="font-label text-[9px] tracking-widest uppercase text-[#F7F7F4]/50">TOTAL SKUS</span>
          <div className="font-display text-4xl mt-2">{totalSkuCount}</div>
        </div>

        <div className="bg-[#161616] text-[#F7F7F4] p-6 rounded-sm border border-[#F7F7F4]/5">
          <span className="font-label text-[9px] tracking-widest uppercase text-[#F7F7F4]/50">TOTAL STOCK IN STOCK</span>
          <div className="font-display text-4xl mt-2">{totalUnits} UNITS</div>
        </div>

        <div className="bg-[#161616] text-[#F7F7F4] p-6 rounded-sm border border-[#F7F7F4]/5">
          <span className="font-label text-[9px] tracking-widest uppercase text-[#F7F7F4]/50">OUT OF STOCK SKUS</span>
          <div className="font-display text-4xl mt-2 text-red-500">{outOfStockSkuCount}</div>
        </div>

        <div className="bg-[#161616] text-[#F7F7F4] p-6 rounded-sm border border-[#c8ff00]/20">
          <span className="font-label text-[9px] tracking-widest uppercase text-[#c8ff00]">LOW STOCK SKUS (≤2)</span>
          <div className="font-display text-4xl mt-2 text-[#c8ff00]">{lowStockSkuCount}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 border border-[#0A0A0A]/10 rounded-sm justify-between">
        <div className="w-full sm:max-w-md relative">
          <span className="material-symbols-outlined absolute left-3 top-3.5 text-[#0A0A0A]/40 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by SKU or Product Name..."
            className="w-full bg-[#F7F7F4] border border-[#0A0A0A]/10 pl-10 pr-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A]"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer font-label text-xs uppercase tracking-wider text-[#0A0A0A]">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={e => setShowLowStockOnly(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          SHOW LOW STOCK (≤2) ONLY
        </label>
      </div>

      {/* Inventory Grid Table */}
      <div className="bg-white border border-[#0A0A0A]/10 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0A] text-[#F7F7F4] font-label text-[10px] tracking-widest uppercase">
                <th className="px-6 py-4">PRODUCT</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">SIZE</th>
                <th className="px-6 py-4 text-center">CURRENT CAPACITY</th>
                <th className="px-6 py-4 text-right">QUICK ADJUST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A0A0A]/10">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#0A0A0A]/50 font-body text-sm">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                filteredVariants.map(v => {
                  const isLow = v.stock <= 2;
                  const isOut = v.stock === 0;
                  const loading = updatingId === v.id;

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-[#F7F7F4]/50 transition-colors ${
                        isOut ? "bg-red-500/[0.02]" : isLow ? "bg-amber-500/[0.01]" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F7F7F4] border border-[#0A0A0A]/5 relative rounded-sm overflow-hidden flex items-center justify-center p-0.5">
                            <Image
                              src={v.product.imageUrl || "/images/products/placeholder.jpg"}
                              alt={v.product.name}
                              fill
                              className="object-contain"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <span className="font-label text-[8px] tracking-widest text-[#0A0A0A]/60 uppercase block">
                              {v.product.brand.name}
                            </span>
                            <span className="font-headline text-sm uppercase tracking-tight text-[#0A0A0A] block line-clamp-1">
                              {v.product.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[#0A0A0A]/70">
                        {v.sku}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold">
                        {v.sizeEu}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`font-mono text-sm font-bold px-3 py-1 rounded-sm border ${
                              isOut
                                ? "bg-red-500/10 text-red-600 border-red-500/20"
                                : isLow
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                : "bg-[#0A0A0A]/5 text-[#0A0A0A] border-[#0A0A0A]/10"
                            }`}
                          >
                            {v.stock} UNITS
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex border border-[#0A0A0A]/10 rounded-sm overflow-hidden">
                            <button
                              onClick={() => adjustStock(v.id, v.stock, -1)}
                              disabled={loading || v.stock === 0}
                              className="bg-white hover:bg-[#F7F7F4] text-[#0A0A0A] w-10 h-10 flex items-center justify-center font-bold disabled:opacity-30 border-r border-[#0A0A0A]/10"
                            >
                              -
                            </button>
                            <button
                              onClick={() => adjustStock(v.id, v.stock, 1)}
                              disabled={loading}
                              className="bg-white hover:bg-[#F7F7F4] text-[#0A0A0A] w-10 h-10 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center border border-[#0A0A0A]/10 rounded-sm overflow-hidden">
                            <input
                              type="number"
                              min="0"
                              placeholder="Set"
                              disabled={loading}
                              value={typedStocks[v.id] ?? ""}
                              onChange={e => {
                                const val = e.target.value;
                                setTypedStocks(prev => ({ ...prev, [v.id]: val }));
                              }}
                              className="w-14 h-10 bg-white text-center font-mono text-xs focus:outline-none"
                            />
                            <button
                              onClick={() => saveTypedStock(v.id)}
                              disabled={loading || typedStocks[v.id] === undefined}
                              className="bg-[#0A0A0A] text-[#F7F7F4] hover:bg-[#c8ff00] hover:text-[#0A0A0A] px-3.5 h-10 font-label text-[9px] tracking-widest uppercase transition-colors disabled:opacity-40"
                            >
                              SET
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
