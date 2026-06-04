"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

interface Variant {
  id: number;
  sizeEu: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  imageUrl: string;
  brand: {
    name: string;
    slug: string;
  };
  variants: Variant[];
}

interface ShopClientProps {
  initialProducts: Product[];
}

// US to EU size mapping helper to filter actual DB sizes
const SIZE_MAP: Record<string, string[]> = {
  "7": ["40", "S"],
  "7.5": ["40", "41"],
  "8": ["41", "M"],
  "8.5": ["41", "42"],
  "9": ["42", "L"],
  "9.5": ["43", "XL"],
  "10": ["44", "XXL"],
  "10.5": ["45"],
};

export default function ShopClient({ initialProducts }: ShopClientProps) {
  // Mock initial state to match the mockup exactly
  // Mockup has Nike and Supreme checked, and sizes 9 and 9.5 checked
  const [selectedBrands, setSelectedBrands] = useState<string[]>(["nike", "supreme"]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["9", "9.5"]);
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Toggle brand selection
  const handleBrandChange = (brandSlug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandSlug)
        ? prev.filter((b) => b !== brandSlug)
        : [...prev, brandSlug]
    );
    setCurrentPage(1);
  };

  // Toggle size selection
  const handleSizeClick = (sizeUs: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeUs)
        ? prev.filter((s) => s !== sizeUs)
        : [...prev, sizeUs]
    );
    setCurrentPage(1);
  };

  // Clear a specific filter pill
  const removeFilter = (type: "brand" | "size", value: string) => {
    if (type === "brand") {
      setSelectedBrands((prev) => prev.filter((b) => b !== value));
    } else if (type === "size") {
      setSelectedSizes((prev) => prev.filter((s) => s !== value));
    }
    setCurrentPage(1);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setMaxPrice(1500);
    setCurrentPage(1);
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // Brand filter
        if (selectedBrands.length > 0) {
          if (!selectedBrands.includes(product.brand.slug)) {
            return false;
          }
        }

        // Price filter
        const price = Number(product.basePrice);
        if (price > maxPrice) {
          return false;
        }

        // Size filter
        if (selectedSizes.length > 0) {
          const hasMatchingSize = product.variants.some((variant) => {
            if (variant.stock <= 0) return false;
            // Check if this variant size maps to any selected US size
            return selectedSizes.some((selectedUsSize) => {
              const mappedEuSizes = SIZE_MAP[selectedUsSize] || [];
              return mappedEuSizes.includes(variant.sizeEu);
            });
          });
          if (!hasMatchingSize) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.basePrice);
        const priceB = Number(b.basePrice);
        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        // Default newest (createdAt desc or id desc)
        return b.id - a.id;
      });
  }, [initialProducts, selectedBrands, selectedSizes, maxPrice, sortBy]);

  // Paginated products (4 items per page in mockup page, but let's show all or support pagination cleanly)
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Compute total active filter count
  const activeFiltersCount = selectedBrands.length + selectedSizes.length + (maxPrice < 1500 ? 1 : 0);

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 flex flex-col gap-10 bg-white">
      
      {/* Page Title & Breadcrumbs */}
      <div className="space-y-2">
        <div className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-[#888888]">
          HOME / SHOP ALL
        </div>
        <h1 className="font-display text-7xl md:text-8xl font-black uppercase tracking-tighter text-[#0A0A0A] leading-none">
          SHOP ALL
        </h1>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left Side: Filter Sidebar (1/4 width) */}
        <aside className="w-full lg:w-[240px] shrink-0 space-y-10 border-r border-[#E5E5E5] pr-8 pb-10 lg:pb-0">
          
          {/* BRANDS Section */}
          <div className="space-y-4">
            <h3 className="font-label text-xs tracking-[0.15em] uppercase text-[#0A0A0A] font-black">
              BRANDS
            </h3>
            <div className="space-y-3">
              {[
                { label: "Nike", slug: "nike" },
                { label: "Adidas", slug: "adidas" },
                { label: "Supreme", slug: "supreme" },
                { label: "Jordan", slug: "jordan" },
              ].map((brand) => {
                const isChecked = selectedBrands.includes(brand.slug);
                return (
                  <label 
                    key={brand.slug} 
                    className="flex items-center gap-3 cursor-pointer group text-sm text-[#0A0A0A]"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleBrandChange(brand.slug)}
                      className="w-4 h-4 accent-[#0A0A0A] border-[#E5E5E5] cursor-pointer"
                    />
                    <span className={`transition-colors ${isChecked ? "font-bold" : "group-hover:text-black text-[#555555]"}`}>
                      {brand.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SIZES (US) Section */}
          <div className="space-y-4">
            <h3 className="font-label text-xs tracking-[0.15em] uppercase text-[#0A0A0A] font-black">
              SIZE (US)
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5"].map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => handleSizeClick(size)}
                    className={`h-10 text-xs font-mono font-bold transition-all border ${
                      isSelected
                        ? "bg-[#c8ff00] text-[#0A0A0A] border-[#c8ff00]"
                        : "bg-white text-[#0A0A0A] border-[#E5E5E5] hover:border-[#0A0A0A]"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRICE RANGE Section */}
          <div className="space-y-4">
            <h3 className="font-label text-xs tracking-[0.15em] uppercase text-[#0A0A0A] font-black">
              PRICE RANGE
            </h3>
            
            <div className="space-y-2">
              {/* Custom price track slider styling */}
              <div className="relative pt-2">
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full accent-[#0A0A0A] bg-[#E5E5E5] h-1 rounded-none appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #c8ff00 0%, #c8ff00 ${((maxPrice - 100) / 1400) * 100}%, #E5E5E5 ${((maxPrice - 100) / 1400) * 100}%, #E5E5E5 100%)`
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-[#0A0A0A] font-mono font-bold pt-1">
                <span>$100</span>
                <span>${maxPrice === 1500 ? "1,500+" : maxPrice}</span>
              </div>
            </div>
          </div>

        </aside>

        {/* Right Side: Active Filters, Sort & Grid (3/4 width) */}
        <div className="flex-grow w-full space-y-6">
          
          {/* Active Filters & Sort Row */}
          <div className="border border-[#E5E5E5] bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {activeFiltersCount > 0 ? (
                <>
                  <button
                    onClick={resetFilters}
                    className="bg-[#c8ff00] text-[#0A0A0A] text-[10px] font-label font-black tracking-widest uppercase px-4 py-2 hover:opacity-90 transition-opacity"
                  >
                    ALL FILTERS ({activeFiltersCount})
                  </button>

                  {/* Brand Pills */}
                  {selectedBrands.map((brand) => (
                    <span 
                      key={brand}
                      className="inline-flex items-center gap-1.5 bg-white border border-[#0A0A0A] text-xs font-medium uppercase px-3 py-1.5"
                    >
                      {brand}
                      <button 
                        onClick={() => removeFilter("brand", brand)}
                        className="hover:text-red-500 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}

                  {/* Size Pills */}
                  {selectedSizes.map((size) => (
                    <span 
                      key={size}
                      className="inline-flex items-center gap-1.5 bg-white border border-[#0A0A0A] text-xs font-medium uppercase px-3 py-1.5"
                    >
                      SIZE {size}
                      <button 
                        onClick={() => removeFilter("size", size)}
                        className="hover:text-red-500 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}
                  
                  {/* Price Pill if customized */}
                  {maxPrice < 1500 && (
                    <span className="inline-flex items-center gap-1.5 bg-white border border-[#0A0A0A] text-xs font-medium uppercase px-3 py-1.5">
                      UNDER ${maxPrice}
                      <button 
                        onClick={() => setMaxPrice(1500)}
                        className="hover:text-red-500 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-[#888888] font-label font-bold uppercase tracking-wider pl-2">
                  No active filters
                </span>
              )}
            </div>

            {/* Sort Selection Dropdown */}
            <div className="flex items-center gap-2 self-end md:self-auto font-label text-xs tracking-wider uppercase font-semibold text-[#0A0A0A]">
              <span>SORT BY:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-black pr-6 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="newest">NEWEST ARRIVALS</option>
                  <option value="price_asc">PRICE: LOW TO HIGH</option>
                  <option value="price_desc">PRICE: HIGH TO LOW</option>
                </select>
                <span className="material-symbols-outlined absolute right-0 top-0.5 text-gray-500 text-xs pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

          </div>

          {/* Product Cards Grid */}
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-20 border border-[#E5E5E5] text-[#888888] text-sm">
              No products found matching the criteria. Try clearing some filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedProducts.map((p) => {
                const price = Number(p.basePrice);
                
                // Dynamically tag some sneakers with premium badges matching the mockup
                let badge = "";
                if (p.name.includes("Chicago") || p.name.includes("Retro") || p.name.includes("Off-White")) {
                  badge = "NEW";
                } else if (p.name.includes("Infrared") || p.name.includes("Air Max") || p.name.includes("Panda")) {
                  badge = "LIMITED";
                }

                return (
                  <Link
                    key={p.slug}
                    href={`/product/${p.slug}`}
                    className="group block transition-all"
                  >
                    {/* Image Box */}
                    <div className="aspect-square bg-white border border-[#E5E5E5] relative flex items-center justify-center p-6 mb-3 transition-colors group-hover:border-[#0A0A0A]">
                      {badge && (
                        <span className="absolute top-2.5 left-2.5 bg-black text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 z-10 leading-none">
                          {badge}
                        </span>
                      )}
                      
                      <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      </div>
                    </div>

                    {/* Meta info underneath */}
                    <div className="space-y-0.5 px-1">
                      <span className="block font-label text-[9px] tracking-widest text-[#888888] uppercase font-bold">
                        {p.brand.name}
                      </span>
                      <h3 className="font-display text-sm font-bold uppercase tracking-tight text-[#0A0A0A] leading-tight group-hover:text-[#c8ff00] transition-colors truncate">
                        {p.name}
                      </h3>
                      <p className="font-display text-sm font-black text-[#0A0A0A]">
                        ${price.toFixed(0)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 pt-12">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="text-[#0A0A0A] disabled:opacity-30 hover:opacity-75 transition-opacity font-label text-xs uppercase tracking-widest font-black flex items-center"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>

              <div className="flex gap-4 text-xs font-mono font-bold">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`transition-colors ${isActive ? "text-[#0A0A0A] underline underline-offset-4 decoration-2" : "text-[#888888] hover:text-[#0A0A0A]"}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="text-[#0A0A0A] disabled:opacity-30 hover:opacity-75 transition-opacity font-label text-xs uppercase tracking-widest font-black flex items-center"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
