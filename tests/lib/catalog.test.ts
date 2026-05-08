import { describe, it, expect } from "vitest";
import { ProductSchema, KBChunkSchema, loadProducts, loadKB } from "@/lib/catalog";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("catalog", () => {
  it("validates a product", () => {
    const p = ProductSchema.parse({
      slug: "jordan-1-mid-hyper-royal",
      name: "Jordan 1 Mid Hyper Royal",
      brand: "nike",
      image_url: "/images/products/jordan-1-mid-hyper-royal.jpg",
      source_url: "https://www.eightyfiveeleven.com/product-page/jordan-1-mid-hyper-royal",
      description: "Hyper Royal colorway, mid-cut.",
    });
    expect(p.brand).toBe("nike");
  });

  it("rejects unknown brand", () => {
    expect(() =>
      ProductSchema.parse({
        slug: "x", name: "X", brand: "puma",
        image_url: "/", source_url: "/", description: "",
      })
    ).toThrow();
  });

  it("validates a KB chunk", () => {
    const c = KBChunkSchema.parse({
      id: "svc-auth", type: "service",
      title: "Sneaker Authentication", text: "...",
    });
    expect(c.type).toBe("service");
  });

  it("loadProducts reads a JSON file", () => {
    const tmp = path.join(os.tmpdir(), `products-${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify([{
      slug: "x", name: "X", brand: "nike",
      image_url: "/x.jpg", source_url: "https://x", description: "x",
    }]));
    const arr = loadProducts(tmp);
    expect(arr).toHaveLength(1);
  });
});
