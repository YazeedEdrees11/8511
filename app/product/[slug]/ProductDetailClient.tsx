"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

interface Variant {
  id: number;
  sizeEu: string;
  stock: number;
  price: any;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  basePrice: any;
  brand: {
    name: string;
    slug: string;
  };
  variants: Variant[];
}

interface ProductDetailClientProps {
  product: Product;
  related: Product[];
}

export default function ProductDetailClient({ product, related }: ProductDetailClientProps) {
  const cart = useCart();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.find(v => v.stock > 0) || product.variants[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [is3DOpen, setIs3DOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Conversion: EU to US sneaker sizes
  function euToUs(eu: string) {
    const num = parseFloat(eu);
    if (isNaN(num)) return eu;
    if (num === 36) return "4Y";
    if (num === 37.5) return "5Y";
    if (num === 38) return "5.5Y";
    if (num === 39) return "6.5Y";
    if (num === 40) return "7";
    if (num === 40.5) return "7.5";
    if (num === 41) return "8";
    if (num === 42) return "8.5";
    if (num === 42.5) return "9";
    if (num === 43) return "9.5";
    if (num === 44) return "10";
    if (num === 44.5) return "10.5";
    if (num === 45) return "11";
    if (num === 45.5) return "11.5";
    if (num === 46) return "12";
    if (num === 47.5) return "13";
    return (num - 33).toString();
  }

  // Gallery images (simulated views based on the primary image for a realistic catalog experience)
  const images = [
    product.imageUrl,
    product.imageUrl, // angle 2
    product.imageUrl, // angle 3
    product.imageUrl, // angle 4
  ];

  const originalPrice = product.basePrice ? Number(product.basePrice) * 1.15 : 0;
  const currentPrice = product.basePrice ? Number(product.basePrice) : 0;

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setIsAdding(true);
    try {
      await cart.addItem({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: quantity,
      });
      cart.open();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  }

  // Toggle Accordion Tabs
  const toggleTab = (tab: string) => {
    setActiveTab(prev => (prev === tab ? null : tab));
  };

  // WhatsApp contact link
  const sizeLabel = selectedVariant ? `US ${euToUs(selectedVariant.sizeEu)} (EU ${selectedVariant.sizeEu})` : "";
  const whatsAppText = encodeURIComponent(
    `Hello Eighty Five Eleven, I'm interested in the "${product.name}" in size ${sizeLabel}. Is it currently available at Swefieh Village?`
  );
  const whatsAppUrl = `https://wa.me/962798511851?text=${whatsAppText}`;

  return (
    <div className="w-full">
      {/* 3D AR Viewer Mock Modal */}
      {is3DOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-3xl bg-white border border-[#E5E5E5] p-8 flex flex-col items-center">
            <button
              onClick={() => setIs3DOpen(false)}
              className="absolute right-4 top-4 text-black hover:opacity-70 transition-opacity"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <h3 className="font-display text-2xl font-black uppercase tracking-tight text-[#0A0A0A] mb-4">
              3D AR VIEWER
            </h3>
            <div className="w-full aspect-video bg-[#EAEAEA] relative overflow-hidden flex items-center justify-center border border-[#E5E5E5]">
              {/* Spinner & Mock interactive canvas */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-5xl text-black animate-spin mb-4">
                  hourglass_empty
                </span>
                <span className="font-label text-xs uppercase tracking-widest font-bold text-black">
                  Loading Interactive 3D Model...
                </span>
                <p className="text-[11px] text-[#555555] max-w-md mt-2 font-body leading-relaxed">
                  Scan QR code on your mobile device to view this sneaker in Augmented Reality (AR) directly in your room.
                </p>
              </div>
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-12 opacity-30 animate-pulse"
              />
            </div>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 bg-black flex items-center justify-center text-white font-black text-xl">
                8511
              </div>
              <div>
                <h4 className="font-label text-xs font-bold uppercase tracking-wider text-black">
                  Augmented Reality Active
                </h4>
                <p className="text-[11px] text-[#888888] font-body mt-0.5">
                  Point your camera to inspect textures, stitching, and proportions in high fidelity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main product display section */}
      <section className="flex flex-col lg:flex-row min-h-[700px] border-b border-[#E5E5E5]">
        {/* LEFT: images */}
        <div className="w-full lg:w-1/2 p-6 md:p-8 flex flex-col gap-4 border-r border-[#E5E5E5] bg-white">
          {/* Main Display Image */}
          <div className="aspect-square bg-white border border-[#E5E5E5] w-full relative flex items-center justify-center group overflow-hidden">
            <Image
              src={images[activeImageIdx]}
              alt={product.name}
              fill
              priority
              className="object-contain p-8 md:p-12 transition-transform duration-500 group-hover:scale-105"
            />
            {/* View in 3D Action */}
            <button
              onClick={() => setIs3DOpen(true)}
              className="absolute bottom-6 right-6 bg-[#c8ff00] text-[#0A0A0A] hover:bg-black hover:text-white px-4 py-2 text-[10px] font-label font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            >
              <span className="material-symbols-outlined text-[14px]">view_in_ar</span>
              VIEW IN 3D
            </button>
          </div>

          {/* Thumbnails row */}
          <div className="grid grid-cols-4 gap-4 h-24">
            {images.map((img, idx) => {
              const isActive = idx === activeImageIdx;
              const isLast = idx === 3;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-full h-full bg-white border p-2 transition-all relative overflow-hidden flex items-center justify-center ${
                    isActive ? "border-black" : "border-[#E5E5E5] opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className={`object-contain p-2 ${
                      idx === 1
                        ? "rotate-12 scale-90"
                        : idx === 2
                        ? "-scale-x-100 rotate-[45deg]"
                        : idx === 3
                        ? "opacity-35 blur-[1px] rotate-[-25deg] scale-75"
                        : ""
                    }`}
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 pointer-events-none">
                      <span className="font-label text-[10px] tracking-wider font-extrabold text-black uppercase">
                        + 2 MORE
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: meta information and selectors */}
        <div className="w-full lg:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-black text-white text-[9px] font-label font-bold uppercase tracking-widest px-3 py-1.5">
              BRAND: {product.brand.name.toUpperCase()}
            </span>
            <span className="bg-[#c8ff00] text-[#0A0A0A] text-[9px] font-label font-bold uppercase tracking-widest px-3 py-1.5">
              IN STOCK
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-black mb-6">
            {product.name}
          </h1>

          {/* Short Copy */}
          <p className="text-[13px] text-[#555555] font-body leading-relaxed mb-6 max-w-xl">
            The {product.name} brings back the iconic shape and craftsmanship that started it all, featuring premium materials, sleek lines, and unparalleled details built to elevate your street style collection.
          </p>

          {/* Price Container */}
          {product.basePrice && (
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl md:text-4xl font-display font-black text-black">
                ${currentPrice.toFixed(2)}
              </span>
              <span className="text-[#888888] font-mono text-sm line-through">
                ${originalPrice.toFixed(2)}
              </span>
            </div>
          )}

          {/* Size Grid Container */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] font-extrabold text-black">
                SELECT SIZE (US)
              </span>
              <button
                type="button"
                onClick={() => alert("Size Guide: Standard Nike/Adidas sizing applies. Choose your regular sneaker size.")}
                className="font-label text-[10px] uppercase tracking-[0.2em] text-[#888888] hover:text-black transition-colors underline font-bold"
              >
                SIZE GUIDE
              </button>
            </div>

            {/* Custom grids representing standard sizes */}
            <div className="grid grid-cols-4 gap-2">
              {product.variants.map(v => {
                const isSelected = selectedVariant?.id === v.id;
                const soldOut = v.stock <= 0;
                const usSize = euToUs(v.sizeEu);

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => {
                      setSelectedVariant(v);
                      // Auto-reset quantity constraints if stock is lower
                      if (quantity > v.stock) {
                        setQuantity(v.stock);
                      }
                    }}
                    className={`h-12 text-xs font-mono font-bold transition-all duration-300 rounded-none flex items-center justify-center ${
                      soldOut
                        ? "border border-[#E5E5E5] text-[#CCCCCC] line-through cursor-not-allowed"
                        : isSelected
                        ? "border-2 border-black bg-white text-black"
                        : "border border-[#E5E5E5] bg-white text-black hover:border-black"
                    }`}
                  >
                    {usSize}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="flex gap-4 mb-4">
            {/* Quantity */}
            <div className="flex border border-[#E5E5E5] h-14 bg-white items-center shrink-0">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity(prev => prev - 1)}
                className="w-12 h-full hover:bg-gray-50 flex items-center justify-center font-bold text-sm text-black disabled:opacity-20 transition-colors"
              >
                -
              </button>
              <span className="w-10 text-center font-mono text-xs font-bold text-black">
                {quantity}
              </span>
              <button
                type="button"
                disabled={selectedVariant ? quantity >= selectedVariant.stock : true}
                onClick={() => setQuantity(prev => prev + 1)}
                className="w-12 h-full hover:bg-gray-50 flex items-center justify-center font-bold text-sm text-black disabled:opacity-20 transition-colors"
              >
                +
              </button>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !selectedVariant || selectedVariant.stock === 0}
              className="flex-1 h-14 bg-black text-white hover:bg-[#222222] font-label uppercase tracking-widest text-[11px] font-bold transition-colors duration-300 rounded-none disabled:opacity-50"
            >
              {isAdding ? "ADDING..." : "ADD TO CART"}
            </button>
          </div>

          {/* WhatsApp Action Button */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-14 border border-[#E5E5E5] hover:border-black text-black bg-white font-label uppercase tracking-widest text-[11px] font-bold transition-colors duration-300 rounded-none flex items-center justify-center gap-2 mb-8"
          >
            {/* SVG WhatsApp icon */}
            <svg
              className="w-4 h-4 text-[#25D366] fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.062 5.248 5.308 0 11.758 0c3.126.001 6.065 1.217 8.274 3.429C22.24 5.64 23.454 8.583 23.45 11.71c-.006 6.463-5.252 11.71-11.702 11.71-1.996-.001-3.956-.51-5.698-1.485L0 24zm6.59-4.859c1.62.963 3.224 1.472 5.08 1.473 5.4 0 9.795-4.394 9.799-9.799.002-2.617-1.01-5.079-2.853-6.924C16.772 2.046 14.314 1.033 11.7 1.033c-5.402 0-9.8 4.397-9.802 9.802-.001 1.93.523 3.528 1.517 5.105l-.99 3.616 3.732-.979zM17.8 14.28c-.324-.162-1.92-.949-2.213-1.055-.293-.106-.507-.16-.72.162-.213.324-.827 1.038-1.013 1.252-.186.213-.373.24-.697.078-.324-.162-1.37-.505-2.61-1.611-.964-.86-1.614-1.921-1.802-2.246-.188-.324-.02-.5-.181-.661-.146-.146-.324-.378-.487-.567-.162-.189-.216-.324-.324-.541-.109-.216-.055-.405-.027-.567.027-.162.213-.513.32-.702.109-.189.162-.324.243-.541.08-.216.04-.405.013-.567-.027-.162-.213-.827-.406-1.292-.189-.456-.379-.393-.52-.401-.134-.007-.288-.008-.44-.008-.153 0-.4-.058-.61-.289-.21-.23-.8-.781-.8-1.905s.82-2.21.929-2.357c.109-.147 1.614-2.464 3.91-3.456.547-.236.974-.377 1.307-.483.55-.175 1.05-.15 1.445-.09.44.066 1.92.786 2.19.15.27-.63.27-1.17.135-1.282-.135-.112-1.332-.71-1.332-1.72s.9-.97 1.1-.97c.21 0 1.2.59 1.4.69.21.11.35.16.51.43.16.27.16 1.55.08 2.19-.08.64-.32 1.38-.8 1.92z" />
            </svg>
            INQUIRE ON WHATSAPP
          </a>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-[#E5E5E5] mb-8 text-center">
            <div className="flex flex-col items-center justify-start">
              <span className="material-symbols-outlined text-[20px] text-black mb-1">
                verified
              </span>
              <span className="font-label text-[8px] tracking-[0.1em] font-extrabold uppercase text-black leading-tight">
                100% Authentic<br />Guaranteed
              </span>
            </div>
            <div className="flex flex-col items-center justify-start">
              <span className="material-symbols-outlined text-[20px] text-black mb-1">
                local_shipping
              </span>
              <span className="font-label text-[8px] tracking-[0.1em] font-extrabold uppercase text-black leading-tight">
                Worldwide<br />Shipping
              </span>
            </div>
            <div className="flex flex-col items-center justify-start">
              <span className="material-symbols-outlined text-[20px] text-black mb-1">
                assignment_return
              </span>
              <span className="font-label text-[8px] tracking-[0.1em] font-extrabold uppercase text-black leading-tight">
                Easy<br />Returns
              </span>
            </div>
          </div>

          {/* Accordion List */}
          <div className="border-t border-[#E5E5E5] divide-y divide-[#E5E5E5]">
            {/* Product Details */}
            <div className="py-4">
              <button
                onClick={() => toggleTab("details")}
                className="w-full flex items-center justify-between text-left font-label text-[10px] tracking-[0.2em] font-extrabold text-black uppercase"
              >
                <span>PRODUCT DETAILS</span>
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${
                  activeTab === "details" ? "rotate-180" : ""
                }`}>
                  keyboard_arrow_down
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${
                activeTab === "details" ? "max-h-96 mt-4" : "max-h-0"
              }`}>
                <div className="font-body text-xs leading-relaxed text-[#555555] space-y-3 whitespace-pre-line">
                  {product.description}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F5F5F5] font-mono text-[10px] uppercase">
                    <div>
                      <span className="text-[#888888] block">Brand:</span>
                      <span className="font-bold text-black">{product.brand.name}</span>
                    </div>
                    <div>
                      <span className="text-[#888888] block">Model:</span>
                      <span className="font-bold text-black">{product.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping & Returns */}
            <div className="py-4">
              <button
                onClick={() => toggleTab("shipping")}
                className="w-full flex items-center justify-between text-left font-label text-[10px] tracking-[0.2em] font-extrabold text-black uppercase"
              >
                <span>SHIPPING & RETURNS</span>
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${
                  activeTab === "shipping" ? "rotate-180" : ""
                }`}>
                  keyboard_arrow_down
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${
                activeTab === "shipping" ? "max-h-96 mt-4" : "max-h-0"
              }`}>
                <div className="font-body text-xs leading-relaxed text-[#555555] space-y-2">
                  <p>
                    <strong>DOMESTIC SHIPPING:</strong> Free express shipping across Amman. Same-day delivery available for orders placed before 3:00 PM.
                  </p>
                  <p>
                    <strong>INTERNATIONAL SHIPPING:</strong> Shipped via DHL Express within 3-5 business days. Taxes and duties calculated at checkout.
                  </p>
                  <p>
                    <strong>RETURNS:</strong> Returns accepted within 7 days of delivery. Sneaker boxes must remain unopened and double-boxed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Grid */}
      {related.length > 0 && (
        <section className="p-6 md:p-12 lg:p-16 bg-[#F9F9F9]">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter text-black mb-10 text-center sm:text-left">
            YOU MIGHT ALSO LIKE
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {related.map(r => {
              const relOriginalPrice = r.basePrice ? Number(r.basePrice) * 1.12 : 0;
              const relPrice = r.basePrice ? Number(r.basePrice) : 0;

              return (
                <Link key={r.slug} href={`/product/${r.slug}`} className="group flex flex-col bg-white border border-[#E5E5E5] hover:shadow-xl transition-all duration-500">
                  {/* Image container */}
                  <div className="aspect-square bg-white border-b border-[#E5E5E5] p-6 relative flex items-center justify-center overflow-hidden">
                    <Image
                      src={r.imageUrl}
                      alt={r.name}
                      fill
                      className="object-contain p-6 transform group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Badge */}
                    <span className="absolute top-4 left-4 bg-black text-[#c8ff00] text-[9px] font-label font-bold uppercase tracking-widest px-2.5 py-1">
                      NEW
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="font-label text-[9px] tracking-wider text-[#888888] uppercase block mb-1">
                      {r.brand.name}
                    </span>
                    <h3 className="font-display text-base font-bold uppercase tracking-tight text-black line-clamp-1 group-hover:text-[#c8ff00] transition-colors mb-2">
                      {r.name}
                    </h3>
                    <div className="mt-auto flex items-baseline gap-2">
                      <span className="font-mono text-sm font-bold text-black">
                        ${relPrice.toFixed(2)}
                      </span>
                      {relOriginalPrice > 0 && (
                        <span className="font-mono text-xs text-[#888888] line-through">
                          ${relOriginalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
