import { z } from "zod";
import fs from "node:fs";

export const ProductSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.enum(["nike", "adidas", "supreme", "hats"]),
  price: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  image_url: z.string(),
  source_url: z.string(),
  description: z.string(),
});
export type Product = z.infer<typeof ProductSchema>;

export const KBChunkSchema = z.object({
  id: z.string(),
  type: z.enum(["service", "about", "store", "contact"]),
  title: z.string(),
  text: z.string(),
});
export type KBChunk = z.infer<typeof KBChunkSchema>;

export function loadProducts(file = "data/products.json"): Product[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return z.array(ProductSchema).parse(raw);
}

export function loadKB(file = "data/kb.json"): KBChunk[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return z.array(KBChunkSchema).parse(raw);
}
