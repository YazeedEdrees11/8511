"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [variants, setVariants] = useState<VariantWithProduct[]>(initialVariants);
  const [search, setSearch] = useState(searchParams.get("q") || "");
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
  const lowStockSkuCount = variants.filter(v => v.stock > 0 && v.stock <= 2).length;

  // Filters
  const filteredVariants = variants.filter(v => {
    const matchesSearch =
      v.product.name.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = !showLowStockOnly || v.stock <= 2;
    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="p-8 md:p-12 flex-grow flex flex-col gap-8 bg-[#F9F9F9]">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <h1 className="font-display text-6xl md:text-7xl font-black uppercase tracking-tighter text-[#0A0A0A] leading-[0.85] flex flex-col">
          <span>INVENTORY</span>
          <span>CONTROL</span>
        </h1>

        {/* Search */}
        <div className="relative w-64 md:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[#999999] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by SKU or name..."
            className="w-full bg-white border border-[#E5E5E5] pl-10 pr-4 py-3 text-xs focus:border-[#0A0A0A] focus:outline-none transition-colors rounded-none text-[#0A0A0A]"
          />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SKU Count */}
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-none flex flex-col justify-between h-[120px]">
          <span className="font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
            TOTAL SKU COUNT
          </span>
          <span className="font-display text-4xl font-extrabold text-[#0A0A0A] mt-auto">
            {totalSkuCount}
          </span>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-none flex flex-col justify-between h-[120px]">
          <span className="font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
            LOW STOCK ITEMS
          </span>
          <div className="flex items-center gap-3 mt-auto">
            <span className="font-display text-4xl font-extrabold text-[#0A0A0A]">
              {lowStockSkuCount}
            </span>
            {lowStockSkuCount > 0 && (
              <span className="bg-[#c8ff00] text-[#0A0A0A] text-[9px] font-bold tracking-wider uppercase px-2.5 py-1">
                Requires Action
              </span>
            )}
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-none flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-center">
            <span className="font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
              WAREHOUSE CAPACITY
            </span>
            <span className="font-display text-sm font-black text-[#0A0A0A]">
              82%
            </span>
          </div>
          <div className="mt-auto w-full">
            <div className="w-full bg-[#E5E5E5] h-2 rounded-none overflow-hidden">
              <div className="bg-[#c8ff00] h-full" style={{ width: "82%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle filter */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="lowStockToggle"
          checked={showLowStockOnly}
          onChange={e => setShowLowStockOnly(e.target.checked)}
          className="w-4 h-4 accent-[#0A0A0A] border-[#E5E5E5] cursor-pointer"
        />
        <label htmlFor="lowStockToggle" className="font-label text-xs uppercase tracking-wider text-[#0A0A0A] font-semibold cursor-pointer">
          Show Low Stock (≤2) Only
        </label>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-none overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-[#E5E5E5] font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
                <th className="px-8 py-5">SKU</th>
                <th className="px-8 py-5">PRODUCT NAME</th>
                <th className="px-8 py-5">SIZE (US/EU)</th>
                <th className="px-8 py-5">CURRENT STOCK</th>
                <th className="px-8 py-5">CAPACITY LIMIT</th>
                <th className="px-8 py-5">STATUS</th>
                <th className="px-8 py-5 text-right">QUICK ADJUST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-[#999999] font-body text-sm">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filteredVariants.map(v => {
                  const isLow = v.stock <= 2;
                  const loading = updatingId === v.id;

                  // Capacity limit placeholder representation (e.g. static limit based on sizes)
                  const capacityLimit = v.sizeEu.includes("M") || v.sizeEu.includes("L") ? 500 : 300;

                  return (
                    <tr key={v.id} className="hover:bg-[#FAFAFA] transition-colors">
                      {/* SKU */}
                      <td className="px-8 py-4 font-mono text-xs text-[#0A0A0A]/70">
                        {v.sku}
                      </td>

                      {/* Product Name */}
                      <td className="px-8 py-4">
                        <span className="font-display text-[15px] font-bold text-[#0A0A0A] uppercase block">
                          {v.product.name}
                        </span>
                        <span className="font-label text-[9px] tracking-wider text-[#888888] uppercase block mt-0.5">
                          {v.product.brand.name}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="px-8 py-4 font-mono text-[13px] font-bold text-[#0A0A0A]">
                        {v.sizeEu}
                      </td>

                      {/* Stock units */}
                      <td className="px-8 py-4 font-mono text-[13px] font-bold text-[#0A0A0A]">
                        {v.stock}
                      </td>

                      {/* Capacity limit */}
                      <td className="px-8 py-4 font-mono text-[13px] text-[#888888]">
                        {capacityLimit}
                      </td>

                      {/* Status */}
                      <td className="px-8 py-4">
                        {isLow ? (
                          <span className="bg-[#c8ff00] text-[#0A0A0A] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1">
                            Low Stock
                          </span>
                        ) : (
                          <span className="border border-[#E5E5E5] text-[#888888] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1">
                            Optimal
                          </span>
                        )}
                      </td>

                      {/* Quick Adjust */}
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex border border-[#E5E5E5] overflow-hidden">
                            <button
                              onClick={() => adjustStock(v.id, v.stock, -1)}
                              disabled={loading || v.stock === 0}
                              className="bg-white hover:bg-gray-50 text-[#0A0A0A] w-8 h-8 flex items-center justify-center font-bold disabled:opacity-30 border-r border-[#E5E5E5] text-xs transition-colors"
                            >
                              -
                            </button>
                            <button
                              onClick={() => adjustStock(v.id, v.stock, 1)}
                              disabled={loading}
                              className="bg-white hover:bg-gray-50 text-[#0A0A0A] w-8 h-8 flex items-center justify-center font-bold text-xs transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center border border-[#E5E5E5] overflow-hidden">
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
                              className="w-12 h-8 bg-white text-center font-mono text-xs focus:outline-none"
                            />
                            <button
                              onClick={() => saveTypedStock(v.id)}
                              disabled={loading || typedStocks[v.id] === undefined}
                              className="bg-[#0A0A0A] text-white hover:bg-[#222222] px-3.5 h-8 font-label text-[9px] tracking-wider uppercase transition-colors disabled:opacity-40 font-semibold"
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
