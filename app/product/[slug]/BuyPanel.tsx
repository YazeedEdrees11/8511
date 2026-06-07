"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

type Variant = { id: number; sizeEu: string; stock: number };

export default function BuyPanel({
  productId,
  productName,
  variants,
}: {
  productId: number;
  productName: string;
  variants: Variant[];
}) {
  const cart = useCart();
  const firstInStock = variants.find((v) => v.stock > 0)?.id ?? null;
  const [selected, setSelected] = useState<number | null>(firstInStock);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!selected) return;
    setBusy(true);
    try {
      await cart.addItem({ productId, variantId: selected });
      cart.open();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <span className="font-label text-xs uppercase tracking-widest">SELECT SIZE (EU)</span>
          <a href="#" className="font-label text-[10px] uppercase tracking-widest text-[#0A0A0A]/60 hover:text-[#0A0A0A] underline">
            SIZE GUIDE
          </a>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {variants.map((v) => {
            const soldOut = v.stock <= 0;
            const isSelected = v.id === selected;
            return (
              <button
                key={v.id}
                type="button"
                disabled={soldOut}
                aria-pressed={isSelected}
                onClick={() => setSelected(v.id)}
                className={
                  soldOut
                    ? "h-12 border border-[#0A0A0A]/10 font-body text-sm text-[#0A0A0A]/30 line-through cursor-not-allowed rounded-sm"
                    : isSelected
                    ? "h-12 bg-[#0A0A0A] text-[#F7F7F4] font-body text-sm rounded-sm"
                    : "h-12 border border-[#0A0A0A]/20 font-body text-sm hover:border-[#0A0A0A] transition-colors rounded-sm"
                }
              >
                {v.sizeEu}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <button
          type="button"
          disabled={busy || !selected}
          onClick={add}
          className="flex-1 h-14 bg-[#0A0A0A] text-[#F7F7F4] font-label uppercase tracking-wider text-xs hover:bg-primary hover:text-[#0A0A0A] transition-colors rounded-sm flex items-center justify-center disabled:opacity-50"
        >
          {busy ? "ADDING…" : selected ? "ADD TO CART" : "SELECT A SIZE"}
        </button>
        <Link
          href={`/chat?q=${encodeURIComponent(`Tell me about ${productName}`)}`}
          className="flex-1 h-14 border border-[#0A0A0A] text-[#0A0A0A] font-label uppercase tracking-wider text-xs hover:text-primary hover:border-primary transition-colors rounded-sm flex items-center justify-center"
        >
          ASK ABOUT THIS PAIR
        </Link>
      </div>
    </>
  );
}
