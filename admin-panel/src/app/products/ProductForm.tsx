"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addProduct, updateProduct } from "@/app/actions/admin";
import { useToast } from "@/lib/toast";

interface VariantInput {
  sizeEu: string;
  stock: number;
}

interface ProductFormProps {
  productId?: number;
  initialData?: {
    name: string;
    slug: string;
    brandName: string;
    description: string;
    imageUrl: string;
    basePrice: number;
    variants: VariantInput[];
  };
  brands: { name: string; slug: string }[];
}

const PRESET_SNEAKERS = ["40", "41", "42", "43", "44", "45", "46"];
const PRESET_APPAREL = ["XS", "S", "M", "L", "XL", "XXL"];
const PRESET_OS = ["OS"];

export default function ProductForm({ productId, initialData, brands }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [brandName, setBrandName] = useState(initialData?.brandName || "");
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [basePrice, setBasePrice] = useState(initialData?.basePrice ? String(initialData.basePrice) : "");
  const [variants, setVariants] = useState<VariantInput[]>(initialData?.variants || []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");

  // Auto-generate slug from name on new products
  useEffect(() => {
    if (!productId && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  }, [name, productId]);

  function addPresetSizes(presets: string[]) {
    const newVariants = [...variants];
    for (const size of presets) {
      if (!newVariants.some(v => v.sizeEu.toUpperCase() === size.toUpperCase())) {
        newVariants.push({ sizeEu: size, stock: 0 });
      }
    }
    setVariants(newVariants);
  }

  function addCustomSize() {
    setShowSizeModal(true);
    setCustomSizeInput("");
  }

  function submitCustomSize() {
    const size = customSizeInput.trim().toUpperCase();
    if (!size) {
      showToast("Please enter a size.", "warning");
      return;
    }
    if (variants.some(v => v.sizeEu.toUpperCase() === size)) {
      showToast("Size already exists.", "warning");
      setCustomSizeInput("");
      return;
    }
    setVariants([...variants, { sizeEu: size, stock: 0 }]);
    setShowSizeModal(false);
    setCustomSizeInput("");
    showToast(`Size ${size} added.`, "success");
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariantStock(index: number, stock: number) {
    const next = [...variants];
    next[index].stock = Math.max(0, stock);
    setVariants(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const activeBrand = isNewBrand ? newBrandName.trim() : brandName;

    if (!activeBrand) {
      setError("Please specify a brand.");
      setBusy(false);
      return;
    }

    if (variants.length === 0) {
      setError("Please add at least one variant size.");
      setBusy(false);
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      brandName: activeBrand,
      description: description.trim(),
      imageUrl: imageUrl.trim() || "/images/products/placeholder.jpg",
      basePrice: parseFloat(basePrice) || 0,
      variants,
    };

    try {
      if (productId) {
        const res = await updateProduct(productId, payload);
        if (res.success) {
          router.push("/");
          router.refresh();
        }
      } else {
        const res = await addProduct(payload);
        if (res.success) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 md:p-12 flex-grow flex flex-col gap-8 bg-[#F9F9F9]">
      {/* Top Breadcrumb Back Link */}
      <div>
        <Link 
          href="/" 
          className="font-label text-[10px] tracking-[0.2em] text-[#888888] hover:text-[#0A0A0A] uppercase transition-colors flex items-center gap-1.5 font-bold"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          BACK TO INVENTORY
        </Link>
      </div>

      {/* Header Stacked Display Title */}
      <div>
        <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tighter text-[#0A0A0A] leading-[0.85] flex flex-col">
          <span>{productId ? "EDIT" : "NEW"}</span>
          <span>PRODUCT</span>
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-none font-body">
          {error}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Media (1/3 width) */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
              MEDIA
            </span>
            <span className="font-label text-[10px] tracking-[0.15em] uppercase text-[#888888]">
              {imageUrl ? "1/1 uploaded" : "0/1 uploaded"}
            </span>
          </div>

          {/* Media upload dropzone outline */}
          <div className="border border-dashed border-[#CCCCCC] bg-white h-[360px] flex flex-col items-center justify-center p-6 text-center relative group">
            {imageUrl ? (
              // Show preview of current image if set
              <div className="absolute inset-0 p-4 flex items-center justify-center bg-white">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="max-h-full max-w-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-[48px] text-[#CCCCCC] mb-3">
                  cloud_upload
                </span>
                <span className="font-display text-[14px] font-bold text-[#0A0A0A] mb-1">
                  DROP ASSETS HERE
                </span>
                <span className="font-label text-[10px] text-[#888888] leading-relaxed max-w-[200px] uppercase">
                  High-resolution JPG or PNG on neutral background
                </span>
              </div>
            )}
          </div>

          {/* Input field for image URL */}
          <div className="bg-white p-4 border border-[#E5E5E5] space-y-2">
            <label className="block font-label text-[9px] tracking-wider uppercase text-[#888888] font-bold">
              IMAGE PATH / CLOUDINARY URL
            </label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E5E5E5] focus:border-[#0A0A0A] px-3 py-2.5 text-xs focus:outline-none transition-colors rounded-none text-[#0A0A0A]"
              placeholder="e.g. https://res.cloudinary.com/..."
            />
          </div>
        </div>

        {/* Right Columns: Product Details & Sizing (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E5E5] p-8 space-y-8">
          
          {/* SECTION: PRODUCT DETAILS */}
          <div className="space-y-6">
            <div className="border-b border-[#E5E5E5] pb-2">
              <span className="font-label text-[11px] tracking-[0.15em] uppercase text-[#0A0A0A] font-bold">
                PRODUCT DETAILS
              </span>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <label className="block font-label text-[9px] tracking-widest uppercase text-[#888888] font-bold">
                PRODUCT NAME
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-4 py-3 text-sm focus:outline-none transition-colors rounded-none text-[#0A0A0A]"
                placeholder="e.g. Oversized Heavyweight Hoodie"
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-2">
              <label className="block font-label text-[9px] tracking-widest uppercase text-[#888888] font-bold">
                URL SLUG
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-4 py-3 text-sm focus:outline-none transition-colors rounded-none text-[#0A0A0A] font-mono text-xs"
                placeholder="e.g. oversized-heavyweight-hoodie"
              />
            </div>

            {/* Brand Dropdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-label text-[9px] tracking-widest uppercase text-[#888888] font-bold">
                    BRAND
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewBrand(!isNewBrand)}
                    className="font-label text-[9px] text-[#c8ff00] bg-black px-2 py-0.5 rounded-none font-bold uppercase tracking-wider hover:opacity-85"
                  >
                    {isNewBrand ? "SELECT EXIST" : "+ NEW BRAND"}
                  </button>
                </div>

                {isNewBrand ? (
                  <input
                    type="text"
                    required
                    value={newBrandName}
                    onChange={e => setNewBrandName(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-4 py-3 text-sm focus:outline-none transition-colors rounded-none text-[#0A0A0A]"
                    placeholder="Enter brand name"
                  />
                ) : (
                  <div className="relative">
                    <select
                      required
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-4 py-3 text-sm focus:outline-none transition-colors rounded-none text-[#0A0A0A] font-label uppercase tracking-widest text-[11px] appearance-none"
                    >
                      <option value="">SELECT BRAND</option>
                      {brands.map(b => (
                        <option key={b.slug} value={b.name}>
                          {b.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-400 pointer-events-none text-[18px]">
                      unfold_more
                    </span>
                  </div>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="space-y-2">
                <label className="block font-label text-[9px] tracking-widest uppercase text-[#888888] font-bold">
                  CATEGORY
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-4 py-3 text-sm focus:outline-none transition-colors rounded-none text-[#0A0A0A] font-label uppercase tracking-widest text-[11px] appearance-none"
                    defaultValue="APPAREL"
                  >
                    <option value="APPAREL">APPAREL</option>
                    <option value="FOOTWEAR">FOOTWEAR</option>
                    <option value="ACCESSORIES">ACCESSORIES</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-400 pointer-events-none text-[18px]">
                    unfold_more
                  </span>
                </div>
              </div>
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <label className="block font-label text-[9px] tracking-widest uppercase text-[#888888] font-bold">
                RETAIL PRICE (USD)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono text-sm text-[#888888] pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  className="w-full bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] pl-8 pr-4 py-3 text-sm focus:outline-none transition-colors rounded-none text-[#0A0A0A] font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block font-label text-[9px] tracking-widest uppercase text-[#888888] font-bold">
                DESCRIPTION
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-4 py-3 text-sm focus:outline-none transition-colors rounded-none text-[#0A0A0A] font-body"
                placeholder="Editorial copy, fit details, fabric composition..."
              />
            </div>
          </div>

          {/* SECTION: SIZING & INVENTORY */}
          <div className="space-y-6">
            <div className="border-b border-[#E5E5E5] pb-2 flex justify-between items-end">
              <span className="font-label text-[11px] tracking-[0.15em] uppercase text-[#0A0A0A] font-bold">
                SIZING & INVENTORY
              </span>
              <button
                type="button"
                onClick={addCustomSize}
                className="font-label text-[10px] text-white bg-black hover:opacity-85 px-3 py-1 font-bold uppercase tracking-wider"
              >
                + ADD CUSTOM SIZE
              </button>
            </div>

            {/* Available Size Presets */}
            <div className="space-y-2">
              <label className="block font-label text-[9px] tracking-widest uppercase text-[#888888] font-bold">
                QUICK SIZE PRESETS
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addPresetSizes(PRESET_APPAREL)}
                  className="border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white px-4 py-2 font-label text-[10px] tracking-wider uppercase transition-colors rounded-none font-semibold text-[#0A0A0A]"
                >
                  APPAREL (XS-XXL)
                </button>
                <button
                  type="button"
                  onClick={() => addPresetSizes(PRESET_SNEAKERS)}
                  className="border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white px-4 py-2 font-label text-[10px] tracking-wider uppercase transition-colors rounded-none font-semibold text-[#0A0A0A]"
                >
                  SNEAKERS (EU 40-46)
                </button>
                <button
                  type="button"
                  onClick={() => addPresetSizes(PRESET_OS)}
                  className="border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white px-4 py-2 font-label text-[10px] tracking-wider uppercase transition-colors rounded-none font-semibold text-[#0A0A0A]"
                >
                  ONE SIZE (OS)
                </button>
              </div>
            </div>

            {/* Size Variants Grid / Stock input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
              {variants.length === 0 ? (
                <div className="md:col-span-2 text-center py-8 border border-[#E5E5E5] text-[#888888] text-xs font-body">
                  No size variants added yet. Select a preset or add a custom size.
                </div>
              ) : (
                variants.map((v, i) => (
                  <div
                    key={v.sizeEu}
                    className="flex items-center justify-between border border-[#E5E5E5] p-3 bg-[#FAFAFA]"
                  >
                    <div className="font-mono text-sm font-bold text-[#0A0A0A]">
                      {v.sizeEu}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-label text-[9px] tracking-wider text-[#888888] font-bold">
                        STOCK:
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={v.stock}
                        onChange={e => updateVariantStock(i, parseInt(e.target.value) || 0)}
                        className="w-16 bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-2 py-1 text-center font-mono text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="text-red-500 hover:text-red-700 font-label text-[9px] tracking-wider uppercase font-bold"
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 border-t border-[#E5E5E5] pt-6">
            <Link
              href="/"
              className="border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] px-8 py-3.5 font-label text-xs tracking-wider uppercase transition-colors rounded-none font-semibold"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="bg-[#0A0A0A] hover:bg-[#222222] text-white px-8 py-3.5 font-label text-xs tracking-wider uppercase font-bold transition-all rounded-none disabled:opacity-50"
            >
              {busy ? "SAVING..." : productId ? "SAVE PRODUCT" : "CREATE PRODUCT"}
            </button>
          </div>

        </div>

      </div>

      {/* Custom Size Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-md shadow-lg max-w-sm w-full p-8">
            <h3 className="font-display text-lg font-bold text-[#0A0A0A] mb-4 uppercase">
              ADD CUSTOM SIZE
            </h3>
            <p className="text-xs text-[#666666] mb-6 font-body">
              Enter a custom size (e.g. 42.5, M, OS)
            </p>
            <input
              type="text"
              value={customSizeInput}
              onChange={e => setCustomSizeInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitCustomSize()}
              placeholder="e.g. 42.5, M, OS"
              autoFocus
              className="w-full bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-4 py-3 text-sm focus:outline-none transition-colors rounded-none text-[#0A0A0A] mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSizeModal(false);
                  setCustomSizeInput("");
                }}
                className="border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] px-6 py-2.5 font-label text-xs tracking-wider uppercase transition-colors rounded-none font-semibold"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={submitCustomSize}
                className="bg-[#0A0A0A] hover:bg-[#222222] text-white px-6 py-2.5 font-label text-xs tracking-wider uppercase font-bold transition-all rounded-none"
              >
                ADD SIZE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
