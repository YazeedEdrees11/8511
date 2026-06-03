"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addProduct, updateProduct } from "@/app/actions/admin";

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
const PRESET_APPAREL = ["S", "M", "L", "XL"];
const PRESET_OS = ["OS"];

export default function ProductForm({ productId, initialData, brands }: ProductFormProps) {
  const router = useRouter();
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
    const size = prompt("Enter size (e.g. 42.5, M, OS):");
    if (!size) return;
    const cleanSize = size.trim().toUpperCase();
    if (variants.some(v => v.sizeEu.toUpperCase() === cleanSize)) {
      alert("Size already exists.");
      return;
    }
    setVariants([...variants, { sizeEu: cleanSize, stock: 0 }]);
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/" className="text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <div>
          <span className="font-label text-[10px] tracking-widest text-[#0A0A0A]/60 uppercase">
            {productId ? "EDIT PRODUCT" : "NEW PRODUCT"}
          </span>
          <h1 className="font-display text-4xl uppercase tracking-tighter mt-1">
            {productId ? "UPDATE CATALOG PAIR" : "ADD PAIR TO CATALOG"}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-xs p-4 rounded-sm font-body">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: General Info */}
        <div className="space-y-6">
          <h2 className="font-label text-[11px] tracking-widest uppercase border-b border-[#0A0A0A]/10 pb-2">
            PRODUCT METADATA
          </h2>

          <div>
            <label className="block font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60 mb-2">
              PRODUCT NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white border border-[#0A0A0A]/10 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A]"
              placeholder="e.g. Jordan 1 Retro High Chicago"
            />
          </div>

          <div>
            <label className="block font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60 mb-2">
              URL SLUG
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full bg-white border border-[#0A0A0A]/10 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A] font-mono text-xs"
              placeholder="e.g. jordan-1-retro-high-chicago"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60">
                BRAND
              </label>
              <button
                type="button"
                onClick={() => setIsNewBrand(!isNewBrand)}
                className="font-label text-[10px] text-[#c8ff00] hover:underline uppercase tracking-wider font-bold"
              >
                {isNewBrand ? "SELECT EXISTING BRAND" : "+ CREATE NEW BRAND"}
              </button>
            </div>

            {isNewBrand ? (
              <input
                type="text"
                required
                value={newBrandName}
                onChange={e => setNewBrandName(e.target.value)}
                className="w-full bg-white border border-[#0A0A0A]/10 px-4 py-3 text-sm focus:border-[#c8ff00] focus:outline-none transition-colors rounded-sm text-[#0A0A0A]"
                placeholder="Enter new brand name (e.g. Patta)"
              />
            ) : (
              <select
                required
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                className="w-full bg-white border border-[#0A0A0A]/10 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A] font-label uppercase tracking-widest text-[11px]"
              >
                <option value="">SELECT BRAND</option>
                {brands.map(b => (
                  <option key={b.slug} value={b.name}>
                    {b.name.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60 mb-2">
              BASE PRICE (JOD)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={basePrice}
              onChange={e => setBasePrice(e.target.value)}
              className="w-full bg-white border border-[#0A0A0A]/10 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A] font-mono"
              placeholder="e.g. 180.00"
            />
          </div>

          <div>
            <label className="block font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60 mb-2">
              IMAGE PATH / URL
            </label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full bg-white border border-[#0A0A0A]/10 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A]"
              placeholder="e.g. /images/products/jordan-1.jpg"
            />
          </div>

          <div>
            <label className="block font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60 mb-2">
              SPECS & DESCRIPTION (MARKDOWN / PLAIN TEXT)
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white border border-[#0A0A0A]/10 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors rounded-sm text-[#0A0A0A] font-body"
              placeholder="STYLE 555088-101 COLORWAY WHITE/BLACK-VARSITY RED RELEASE DATE 05/30/2015"
            />
          </div>
        </div>

        {/* Right Side: Inventory & Sizes */}
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-[#0A0A0A]/10 pb-2">
            <h2 className="font-label text-[11px] tracking-widest uppercase">
              SIZES & INVENTORY
            </h2>
            <button
              type="button"
              onClick={addCustomSize}
              className="font-label text-[10px] text-[#c8ff00] hover:underline uppercase tracking-wider font-bold"
            >
              + ADD SIZE
            </button>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block font-label text-[9px] tracking-widest uppercase text-[#0A0A0A]/40 mb-2">
              QUICK PRESETS (ADD SIZES)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addPresetSizes(PRESET_SNEAKERS)}
                className="bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 px-3 py-1.5 font-label text-[10px] tracking-wider uppercase hover:border-[#0A0A0A] hover:bg-white transition-all rounded-[2px]"
              >
                SNEAKERS (EU 40-46)
              </button>
              <button
                type="button"
                onClick={() => addPresetSizes(PRESET_APPAREL)}
                className="bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 px-3 py-1.5 font-label text-[10px] tracking-wider uppercase hover:border-[#0A0A0A] hover:bg-white transition-all rounded-[2px]"
              >
                APPAREL (S-XL)
              </button>
              <button
                type="button"
                onClick={() => addPresetSizes(PRESET_OS)}
                className="bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 px-3 py-1.5 font-label text-[10px] tracking-wider uppercase hover:border-[#0A0A0A] hover:bg-white transition-all rounded-[2px]"
              >
                ONE SIZE (OS)
              </button>
            </div>
          </div>

          {/* Variants List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
            {variants.length === 0 ? (
              <div className="text-center py-10 bg-white border border-[#0A0A0A]/5 text-[#0A0A0A]/50 text-xs font-body rounded-sm">
                No variants added yet. Click preset or + Add Size.
              </div>
            ) : (
              variants.map((v, i) => (
                <div
                  key={v.sizeEu}
                  className="flex items-center gap-4 bg-white p-3 border border-[#0A0A0A]/10 rounded-sm"
                >
                  <div className="font-mono text-sm font-bold w-16">{v.sizeEu}</div>
                  <div className="flex-grow flex items-center gap-2">
                    <span className="font-label text-[9px] tracking-widest text-[#0A0A0A]/60 uppercase">
                      STOCK:
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={v.stock}
                      onChange={e => updateVariantStock(i, parseInt(e.target.value) || 0)}
                      className="w-20 bg-[#F7F7F4] border border-[#0A0A0A]/10 px-2 py-1 text-center font-mono text-sm rounded-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="text-red-500 hover:text-red-700 font-label text-[10px] tracking-widest uppercase hover:underline"
                  >
                    REMOVE
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 border-t border-[#0A0A0A]/10 pt-8">
        <Link
          href="/"
          className="border border-[#0A0A0A]/20 bg-white hover:bg-[#F7F7F4] px-8 py-4 font-label text-xs tracking-widest uppercase transition-all rounded-sm"
        >
          CANCEL
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="bg-[#0A0A0A] text-[#F7F7F4] hover:bg-[#c8ff00] hover:text-[#0A0A0A] px-8 py-4 font-label text-xs tracking-widest uppercase font-bold transition-all rounded-sm disabled:opacity-50"
        >
          {busy ? "SAVING..." : productId ? "SAVE CHANGES →" : "CREATE CATALOG ENTRY →"}
        </button>
      </div>
    </form>
  );
}
