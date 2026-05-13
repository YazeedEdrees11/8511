"use client";
import { useState } from "react";
import { useCart } from "./CartProvider";

export default function AddToCartButton({
  productId,
  defaultVariantId,
}: {
  productId: number;
  defaultVariantId?: number;
}) {
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await cart.addItem({ productId, variantId: defaultVariantId });
          cart.open();
        } finally {
          setBusy(false);
        }
      }}
      className="flex-1 h-14 bg-[#0A0A0A] text-[#F7F7F4] font-label uppercase tracking-wider text-xs hover:bg-[#FF3B00] transition-colors rounded-sm flex items-center justify-center disabled:opacity-50"
    >
      {busy ? "ADDING…" : "ADD TO CART"}
    </button>
  );
}
