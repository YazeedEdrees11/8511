"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type CartItem = {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  productSlug: string;
  sizeEu: string | null;
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
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
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

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = (await res.json()) as { items?: CartItem[] };
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
    await refresh();
  }, [refresh]);

  const updateQuantity = useCallback<CartState["updateQuantity"]>(async (cartItemId, quantity) => {
    await fetch(`/api/cart/${cartItemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await refresh();
  }, [refresh]);

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
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
