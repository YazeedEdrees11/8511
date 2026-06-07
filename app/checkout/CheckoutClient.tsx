"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useCart } from "@/components/cart/CartProvider";
import { useCartProducts } from "@/components/cart/useCartProducts";
import { checkout, type AddressInput } from "@/app/actions/orders";
import VerifyBanner from "@/components/auth/VerifyBanner";

const inputCls = "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";
const btnCls = "bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50";

function parsePrice(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export default function CheckoutClient() {
  const cart = useCart();
  const products = useCartProducts();
  const productBySlug = new Map((products ?? []).map((p) => [p.slug, p]));
  // Seed from the already-resolved Firebase user (if any) so a signed-in user
  // skips the loading flash; falls back to null until onAuthStateChanged fires.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(auth.currentUser ? true : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setLoggedIn(!!u)), []);

  const subtotal = cart.items.reduce(
    (sum, item) => sum + parsePrice(productBySlug.get(item.productSlug)?.price) * item.quantity,
    0
  );
  const shipping = cart.items.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  async function placeOrderAction(formData: FormData) {
    setBusy(true);
    setError("");
    const address: AddressInput = {
      line1: String(formData.get("line1")),
      line2: String(formData.get("line2") || ""),
      city: String(formData.get("city")),
      country: String(formData.get("country")),
      postal: String(formData.get("postal") || ""),
    };
    const items = cart.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId ?? undefined,
      quantity: i.quantity,
    }));
    const result = await checkout({ address, items });
    if (result.ok) {
      setOrderNumber(result.orderNumber);
      await cart.refresh();
    } else {
      setError(result.error);
    }
    setBusy(false);
  }

  if (orderNumber) {
    return (
      <div className="grid gap-4">
        <p className="font-body text-lg">Thank you — your order <b>{orderNumber}</b> has been placed.</p>
        <p className="font-body text-sm text-muted">We've emailed the shop and will be in touch about your order.</p>
        <a href="/" className={`${btnCls} justify-self-start`}>BACK TO HOME →</a>
      </div>
    );
  }

  if (loggedIn === null) {
    return <p className="font-body text-sm text-muted">Loading…</p>;
  }

  if (loggedIn === false) {
    return (
      <p className="font-body text-sm text-muted">
        Please <a href="/login" className="text-accent">log in</a> to complete your order.
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <p className="font-body text-sm text-muted">
        Your bag is empty. <a href="/shop" className="text-accent">Continue shopping →</a>
      </p>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <h2 className="font-label text-xs tracking-widest uppercase mb-4">ORDER SUMMARY</h2>
        <div className="space-y-3">
          {cart.items.map((item) => {
            const p = productBySlug.get(item.productSlug);
            return (
              <div key={item.id} className="flex justify-between font-body text-sm">
                <span>{p?.name ?? "…"} × {item.quantity}</span>
                <span>{(parsePrice(p?.price) * item.quantity).toFixed(2)} JOD</span>
              </div>
            );
          })}
          <div className="h-px bg-ink/10 my-2" />
          <div className="flex justify-between font-body text-sm text-muted"><span>Subtotal</span><span>{subtotal.toFixed(2)} JOD</span></div>
          <div className="flex justify-between font-body text-sm text-muted"><span>Shipping</span><span>{shipping.toFixed(2)} JOD</span></div>
          <div className="flex justify-between font-label text-base"><span>TOTAL</span><span>{total.toFixed(2)} JOD</span></div>
        </div>
      </section>

      <section>
        <h2 className="font-label text-xs tracking-widest uppercase mb-4">SHIPPING ADDRESS</h2>
        <div className="mb-4"><VerifyBanner /></div>
        <form action={placeOrderAction} className="grid gap-4">
          <div>
            <label className={labelCls} htmlFor="line1">ADDRESS LINE 1</label>
            <input id="line1" name="line1" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="line2">ADDRESS LINE 2 (OPTIONAL)</label>
            <input id="line2" name="line2" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="city">CITY</label>
            <input id="city" name="city" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="country">COUNTRY</label>
            <input id="country" name="country" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="postal">POSTAL CODE (OPTIONAL)</label>
            <input id="postal" name="postal" className={inputCls} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={`${btnCls} justify-self-start`}>
            {busy ? "PLACING…" : "PLACE ORDER →"}
          </button>
        </form>
      </section>
    </div>
  );
}
