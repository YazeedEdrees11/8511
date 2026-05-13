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
    if (cache) {
      setProducts(cache);
      return;
    }
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
