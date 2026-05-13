# Cart Drawer UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the existing `/api/cart` endpoints to a slide-out shopping bag drawer triggered by the header bag icon. Real PDP "Add to Cart" buttons that talk to the backend instead of opening external URLs.

**Architecture:** A `CartProvider` (React Context) in `app/layout.tsx` owns cart state and the `fetch` calls to `/api/cart`. The `Header` reads `cart.itemCount` to show a badge on the bag icon and opens the drawer on click. The `CartDrawer` reads `cart.items` from the same context. PDP "Add to Cart" button calls `cart.addItem(productId, variantId)` from context.

**Tech Stack:** React Context, Next.js 15 App Router, Tailwind v4.

**Visual reference:** Stitch screen `affc568fdd694c6ea2b9d1ab3774cd83` ("8511 | Editorial Cart Drawer") in project `16609172217967814207`.

---

## File Structure

**New files:**
- `components/cart/CartProvider.tsx` — Context provider + state + API calls
- `components/cart/CartDrawer.tsx` — The slide-out panel UI
- `components/cart/useCart.ts` — Convenience hook re-exporting the context

**Modified:**
- `app/layout.tsx` — Wrap children in `<CartProvider>` and render `<CartDrawer />` near `<ChatWidget />`
- `components/layout/Header.tsx` — Bag icon shows count badge, opens drawer on click
- `app/product/[slug]/page.tsx` — Replace the `<a href={p.sourceUrl}>` "ADD TO CART" link with a client component that calls `cart.addItem`

---

## Task 1: CartProvider with state, fetch, and actions

**File:** `components/cart/CartProvider.tsx`

```tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type CartItem = {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  itemCount: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (input: { productId: number; variantId?: number; quantity?: number }) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/cart")
      .then(r => r.json())
      .then((data: { items?: CartItem[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const addItem = useCallback<CartState["addItem"]>(async (input) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, quantity: input.quantity ?? 1 }),
    });
    const data = (await res.json()) as { items?: CartItem[] };
    setItems(data.items ?? []);
  }, []);

  const removeItem = useCallback<CartState["removeItem"]>(async (cartItemId) => {
    await fetch(`/api/cart/${cartItemId}`, { method: "DELETE" });
    const res = await fetch("/api/cart");
    const data = (await res.json()) as { items?: CartItem[] };
    setItems(data.items ?? []);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        isOpen,
        open: () => setOpen(true),
        close: () => setOpen(false),
        toggle: () => setOpen(o => !o),
        addItem,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
```

- [ ] Create the file above
- [ ] Commit: `feat(cart): add CartProvider context with /api/cart wiring`

---

## Task 2: Product hydration helper

The cart API returns `CartItem` rows with `productId` / `variantId` but no product details. The drawer needs name, image, brand, size to render. We'll fetch and cache the product list once and join on the client.

**File:** `components/cart/useCartProducts.ts`

```tsx
"use client";
import { useEffect, useState } from "react";

export type ApiProduct = {
  slug: string;
  name: string;
  brand: "nike" | "adidas" | "supreme" | "hats";
  price?: string;
  image_url: string;
  source_url: string;
  description: string;
};

let cache: ApiProduct[] | null = null;
let inFlight: Promise<ApiProduct[]> | null = null;

export function useCartProducts() {
  const [products, setProducts] = useState<ApiProduct[] | null>(cache);

  useEffect(() => {
    if (cache) return;
    if (!inFlight) {
      inFlight = fetch("/api/products")
        .then(r => r.json())
        .then((data: ApiProduct[]) => {
          cache = data;
          return data;
        });
    }
    inFlight.then(setProducts);
  }, []);

  return products;
}
```

- [ ] Create the file above
- [ ] Commit: `feat(cart): add useCartProducts product-lookup hook`

---

## Task 3: CartDrawer component

**File:** `components/cart/CartDrawer.tsx`

```tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useCartProducts } from "./useCartProducts";

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

export default function CartDrawer() {
  const cart = useCart();
  const products = useCartProducts();
  const productBySlug = new Map((products ?? []).map(p => [p.slug, p]));
  // The API returns CartItem with productId. We need slug. We'll need a productId → product map.
  // Simpler: refetch /api/products is keyed by slug, but cart items are keyed by id.
  // We'll do a parallel fetch keyed by productId via a separate endpoint OR include product detail in cart response.
  // To keep this task self-contained, the API has been adjusted in this plan to include product+variant in cart items.
  // See Task 4 below — until then, this drawer assumes /api/cart returns enriched items.

  const subtotal = cart.items.reduce((sum, item) => {
    const slug = (item as unknown as { productSlug?: string }).productSlug;
    const p = slug ? productBySlug.get(slug) : undefined;
    return sum + parsePrice(p?.price) * item.quantity;
  }, 0);
  const shipping = cart.items.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={cart.close}
        className={`fixed inset-0 bg-[#0A0A0A]/30 z-40 transition-opacity duration-300 ${
          cart.isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!cart.isOpen}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-[#F7F7F4] z-50 border-l border-[#0A0A0A]/15 flex flex-col transition-transform duration-300 ${
          cart.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!cart.isOpen}
      >
        {/* Header */}
        <header className="h-20 px-6 flex items-center justify-between border-b border-[#0A0A0A]/15 shrink-0">
          <div>
            <p className="font-label text-xs uppercase tracking-widest text-[#0A0A0A]">YOUR BAG</p>
            <p className="font-label text-[10px] uppercase tracking-widest text-[#0A0A0A]/60 mt-1">
              {cart.itemCount} {cart.itemCount === 1 ? "ITEM" : "ITEMS"}
            </p>
          </div>
          <button
            onClick={cart.close}
            className="w-8 h-8 border border-[#0A0A0A] hover:border-[#FF3B00] hover:text-[#FF3B00] flex items-center justify-center transition-colors"
            aria-label="Close cart"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </header>

        {/* Items */}
        <div className="flex-grow overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {cart.items.length === 0 && (
            <p className="font-body text-sm text-[#0A0A0A]/60">Your bag is empty.</p>
          )}
          {cart.items.map(item => {
            // `productSlug` is added server-side in Task 4.
            const slug = (item as unknown as { productSlug?: string }).productSlug;
            const p = slug ? productBySlug.get(slug) : undefined;
            const sizeEu = (item as unknown as { sizeEu?: string }).sizeEu;
            return (
              <div key={item.id} className="flex gap-4 pb-6 border-b border-[#0A0A0A]/10 last:border-b-0">
                <div className="w-24 h-24 bg-white border border-[#0A0A0A]/10 p-3 relative shrink-0">
                  {p && (
                    <Image src={p.image_url} alt={p.name} fill className="object-contain p-1" />
                  )}
                </div>
                <div className="flex-grow flex flex-col">
                  <p className="font-label text-[10px] uppercase tracking-widest text-[#0A0A0A]/60">
                    {p ? BRAND_LABEL[p.brand] : ""}
                  </p>
                  <h3 className="font-headline text-lg tracking-tight uppercase text-[#0A0A0A] leading-tight mt-1">
                    {p?.name ?? "…"}
                  </h3>
                  {sizeEu && (
                    <p className="font-mono text-xs text-[#0A0A0A]/70 mt-1">EU {sizeEu}</p>
                  )}
                  <div className="mt-auto flex items-end justify-between">
                    <p className="font-body text-sm text-[#0A0A0A]">{p?.price ?? ""}</p>
                    <button
                      onClick={() => cart.removeItem(item.id)}
                      className="font-label text-[10px] uppercase tracking-widest text-[#0A0A0A]/40 hover:text-[#FF3B00] transition-colors"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <footer className="border-t border-[#0A0A0A]/15 p-6 flex flex-col gap-4 shrink-0">
            <div className="flex justify-between font-label text-xs uppercase tracking-widest">
              <span className="text-[#0A0A0A]/60">SUBTOTAL</span>
              <span className="text-[#0A0A0A]">{subtotal.toFixed(2)} JOD</span>
            </div>
            <div className="flex justify-between font-label text-xs uppercase tracking-widest">
              <span className="text-[#0A0A0A]/60">SHIPPING</span>
              <span className="text-[#0A0A0A]">{shipping.toFixed(2)} JOD</span>
            </div>
            <div className="border-t border-[#0A0A0A]/15" />
            <div className="flex justify-between items-baseline">
              <span className="font-label text-sm uppercase tracking-widest text-[#0A0A0A]">TOTAL</span>
              <span className="font-body text-lg font-medium text-[#0A0A0A]">{total.toFixed(2)} JOD</span>
            </div>
            <button
              type="button"
              className="h-14 bg-[#0A0A0A] text-[#F7F7F4] font-label text-xs uppercase tracking-widest hover:bg-[#FF3B00] transition-colors"
            >
              CHECKOUT
            </button>
            <button
              type="button"
              onClick={cart.close}
              className="font-label text-[10px] uppercase tracking-widest text-[#0A0A0A]/60 hover:text-[#FF3B00] transition-colors"
            >
              CONTINUE SHOPPING
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
```

- [ ] Create the file above
- [ ] Commit: `feat(cart): add CartDrawer component`

---

## Task 4: Enrich /api/cart response with productSlug and sizeEu

The drawer needs to know which product each cart item refers to. Modify the cart route to include the product slug and the variant's sizeEu in the response items.

**File:** `app/api/cart/route.ts` (modify both `POST` and `GET`)

Replace each `prisma.cart.find...({ include: { items: true } })` and `prisma.cart.create({ data: ..., include: { items: true } })` with:

```ts
include: {
  items: {
    include: {
      product: { select: { slug: true } },
      variant: { select: { sizeEu: true } },
    },
  },
},
```

Then in the response, flatten each item:

```ts
const enriched = {
  ...fresh,
  items: fresh.items.map(it => ({
    ...it,
    productSlug: it.product.slug,
    sizeEu: it.variant?.sizeEu ?? null,
  })),
};
return new Response(JSON.stringify(enriched), { status: 200, headers: ... });
```

Apply the same flattening in `GET`.

Update the cart test `tests/api/cart.test.ts` to assert that the response includes `productSlug` for each item:
```ts
expect(body.items[0].productSlug).toBeDefined();
```

- [ ] Modify `app/api/cart/route.ts`
- [ ] Update the test
- [ ] Run `npm test -- tests/api/cart.test.ts` — expect green
- [ ] Commit: `feat(cart): enrich cart items with productSlug and sizeEu`

---

## Task 5: Wire bag icon and mount drawer

**File:** `components/layout/Header.tsx`

The bag icon button is currently inert. Make it open the cart and show a count badge.

Add `"use client"` (already present) and import the cart hook:

```tsx
import { useCart } from "@/components/cart/CartProvider";
```

Replace the existing bag button:

```tsx
<button className="text-on-surface hover:text-primary transition-colors duration-300 active:opacity-80">
  <span className="material-symbols-outlined">shopping_bag</span>
</button>
```

With:

```tsx
{(() => {
  const cart = useCart();
  return (
    <button
      onClick={cart.open}
      className="relative text-on-surface hover:text-primary transition-colors duration-300 active:opacity-80"
      aria-label="Open cart"
    >
      <span className="material-symbols-outlined">shopping_bag</span>
      {cart.itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3B00] text-[#F7F7F4] text-[9px] font-label flex items-center justify-center rounded-full">
          {cart.itemCount}
        </span>
      )}
    </button>
  );
})()}
```

(The IIFE keeps the hook scoped to a place where it's allowed to be called.)

**File:** `app/layout.tsx`

Wrap and mount:

```tsx
import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
// ...
return (
  <html lang="en">
    <body className="min-h-screen flex flex-col">
      <CartProvider>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
        <CartDrawer />
      </CartProvider>
    </body>
  </html>
);
```

- [ ] Modify `components/layout/Header.tsx`
- [ ] Modify `app/layout.tsx`
- [ ] Commit: `feat(cart): wire header bag icon to open drawer`

---

## Task 6: Replace PDP "Add to Cart" link with a real button

**File:** `app/product/[slug]/page.tsx`

The current PDP has `<a href={p.sourceUrl}>ADD TO CART</a>` which navigates to an external URL. We need a client-side button that calls `cart.addItem`. Since the PDP is a server component, we'll extract the button into a small client component.

**New file:** `components/cart/AddToCartButton.tsx`

```tsx
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
```

Then in `app/product/[slug]/page.tsx`, replace:

```tsx
<a
  href={p.sourceUrl}
  target="_blank"
  rel="noreferrer"
  className="flex-1 h-14 bg-[#0A0A0A] text-[#F7F7F4] font-label uppercase tracking-wider text-xs hover:bg-[#FF3B00] transition-colors rounded-sm flex items-center justify-center"
>
  ADD TO CART
</a>
```

With (after adding `import AddToCartButton from "@/components/cart/AddToCartButton";` at top):

```tsx
<AddToCartButton
  productId={p.id}
  defaultVariantId={p.variants.find(v => v.stock > 0)?.id}
/>
```

This passes the first in-stock variant. (Future: real size selector that wires the chosen variant into the button.)

- [ ] Create `components/cart/AddToCartButton.tsx`
- [ ] Modify `app/product/[slug]/page.tsx`
- [ ] Commit: `feat(cart): replace PDP external link with real add-to-cart button`

---

## Task 7: End-to-end verification + cleanup

- [ ] Run `npm run db:up` (probably already up)
- [ ] Run `npm test` — all suites green
- [ ] Run `npm run dev`
- [ ] In browser:
  - Open any PDP, click ADD TO CART → drawer slides open showing the item with product image, brand, size, price
  - Close drawer (X or click overlay)
  - Reopen via bag icon in header — same item still there
  - Click REMOVE on an item → it disappears from the drawer
  - Header bag icon badge updates in real time as you add/remove
  - Subtotal/shipping/total update correctly
- [ ] If you reload the page, the items persist (the `cart_sid` cookie carries the session)
- [ ] Commit any small fixes found during this pass
- [ ] No README change needed — the cart "just works" via existing patterns

## Acceptance

- Bag icon in header opens the drawer
- Drawer shows items with image, name, brand, size (EU/S/M/etc), price, and a remove link
- Subtotal/shipping/total computed client-side from the items + product price
- "ADD TO CART" on PDP adds the first in-stock variant and opens the drawer
- Cart persists across page reloads via the `cart_sid` cookie
- All existing tests still pass

## Out of scope

- Quantity stepper (the design has +/- buttons but they're not wired in this iteration — single-quantity adds only)
- Real size selector on PDP (currently uses first in-stock variant)
- Checkout button (clicks but does nothing — will lead to a future checkout page that calls `placeOrder`)
- /cart full page
- Mobile-specific tweaks beyond `w-full sm:w-[440px]`
