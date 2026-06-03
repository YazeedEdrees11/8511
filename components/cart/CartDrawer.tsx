"use client";
import Image from "next/image";
import { useCart, type CartItem } from "./CartProvider";
import { useCartProducts, type ApiProduct } from "./useCartProducts";

const BRAND_LABEL: Record<string, string> = {
  nike: "NIKE",
  adidas: "ADIDAS",
  supreme: "SUPREME",
  hats: "HATS",
};

function parsePrice(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function sizeLabel(sizeEu: string | null): string | null {
  if (!sizeEu) return null;
  if (sizeEu === "OS") return null;
  if (/^\d+$/.test(sizeEu)) return `EU ${sizeEu}`;
  return `SIZE ${sizeEu}`;
}

function CartItemRow({
  item,
  product,
}: {
  item: CartItem;
  product: ApiProduct | undefined;
}) {
  const cart = useCart();
  const size = sizeLabel(item.sizeEu);
  const lineTotal = parsePrice(product?.price) * item.quantity;

  return (
    <div className="flex gap-6">
      <div className="w-24 h-24 bg-white border border-[#0A0A0A]/10 p-2 flex-shrink-0 relative">
        {product && (
          <Image src={product.image_url} alt={product.name} fill className="object-contain p-1" />
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <span className="font-label text-[10px] uppercase text-[#0A0A0A]/60 tracking-widest">
          {product ? BRAND_LABEL[product.brand] : ""}
        </span>
        <h3 className="font-headline text-lg leading-tight uppercase">
          {product?.name ?? "…"}
        </h3>
        {size && <div className="mt-1 font-mono text-[10px] text-[#0A0A0A]/80">{size}</div>}
        <div className="mt-auto flex items-end justify-between">
          <div className="flex items-center border border-[#0A0A0A]/10 h-8">
            <button
              onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
              className="px-2 h-full flex items-center justify-center hover:bg-[#0A0A0A] hover:text-[#F7F7F4] transition-colors"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="w-8 text-center text-xs font-mono">{item.quantity}</span>
            <button
              onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
              className="px-2 h-full flex items-center justify-center hover:bg-[#0A0A0A] hover:text-[#F7F7F4] transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <div className="text-right">
            <span className="font-label text-sm">{lineTotal.toFixed(2)} JOD</span>
            <button
              onClick={() => cart.removeItem(item.id)}
              className="block mt-1 font-label text-[10px] text-[#0A0A0A]/40 uppercase tracking-widest hover:text-primary transition-colors ml-auto"
            >
              REMOVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const cart = useCart();
  const products = useCartProducts();
  const productBySlug = new Map((products ?? []).map(p => [p.slug, p]));

  const subtotal = cart.items.reduce(
    (sum, item) => sum + parsePrice(productBySlug.get(item.productSlug)?.price) * item.quantity,
    0
  );
  const shipping = cart.items.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={cart.close}
        className={`fixed inset-0 bg-[#0A0A0A]/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          cart.isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!cart.isOpen}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full md:w-[440px] bg-[#F7F7F4] border-l border-[#0A0A0A]/15 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          cart.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!cart.isOpen}
      >
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-[#F7F7F4] border-b border-[#0A0A0A]/15 shrink-0">
          <div>
            <h2 className="font-label tracking-widest uppercase text-xs">YOUR BAG</h2>
            <p className="text-[10px] text-[#0A0A0A]/60 font-medium font-label tracking-widest mt-1">
              {cart.itemCount} {cart.itemCount === 1 ? "ITEM" : "ITEMS"}
            </p>
          </div>
          <button
            onClick={cart.close}
            className="w-8 h-8 border border-[#0A0A0A] flex items-center justify-center hover:bg-primary hover:text-[#0A0A0A] hover:border-primary transition-colors duration-200"
            aria-label="Close cart"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </header>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          {cart.items.length === 0 ? (
            <p className="font-body text-sm text-[#0A0A0A]/60">Your bag is empty.</p>
          ) : (
            cart.items.map(item => (
              <CartItemRow key={item.id} item={item} product={productBySlug.get(item.productSlug)} />
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <footer className="p-8 bg-[#F7F7F4] border-t border-[#0A0A0A]/15 space-y-4 shrink-0">
            <div className="flex justify-between items-center text-[10px] font-label uppercase tracking-widest text-[#0A0A0A]/60">
              <span>SUBTOTAL</span>
              <span>{subtotal.toFixed(2)} JOD</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-label uppercase tracking-widest text-[#0A0A0A]/60">
              <span>SHIPPING</span>
              <span>{shipping.toFixed(2)} JOD</span>
            </div>
            <div className="h-[1px] bg-[#0A0A0A]/10" />
            <div className="flex justify-between items-center">
              <span className="font-label uppercase tracking-widest text-sm">TOTAL</span>
              <span className="font-label font-bold text-lg">{total.toFixed(2)} JOD</span>
            </div>
            <button
              type="button"
              className="w-full h-14 bg-[#0A0A0A] text-[#F7F7F4] font-label tracking-widest uppercase text-sm hover:bg-primary hover:text-[#0A0A0A] transition-all duration-300"
            >
              CHECKOUT
            </button>
            <button
              type="button"
              onClick={cart.close}
              className="w-full text-center py-2 font-label text-[10px] text-[#0A0A0A]/60 uppercase tracking-widest hover:text-[#0A0A0A] transition-colors"
            >
              CONTINUE SHOPPING
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
