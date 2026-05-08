// scripts/ingest.ts — scrape the live Wix site into data/products.json
// Requires: firecrawl CLI installed and authenticated (no env var needed).
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { ProductSchema, type Product } from "../lib/catalog";

const BRANDS = ["nike", "adidas", "supreme", "caps"] as const;
const BRAND_TO_KEY: Record<(typeof BRANDS)[number], Product["brand"]> = {
  nike: "nike", adidas: "adidas", supreme: "supreme", caps: "hats",
};
const ROOT = "https://www.eightyfiveeleven.com";
const OUT_DIR = path.join("public", "images", "products");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(".firecrawl", { recursive: true });

function fc(args: string): string {
  return execSync(`firecrawl ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location, dest).then(resolve, reject); return;
      }
      res.pipe(file); file.on("finish", () => file.close(() => resolve()));
    }).on("error", reject);
  });
}

function slugifyFromUrl(u: string): string {
  return u.split("/").filter(Boolean).pop()!.toLowerCase();
}

async function scrapeProductPage(url: string, brand: Product["brand"]): Promise<Product | null> {
  const slug = slugifyFromUrl(url);
  const cache = `.firecrawl/product-${slug}.md`;
  if (!fs.existsSync(cache)) fc(`scrape "${url}" -o ${cache} --format markdown`);
  const md = fs.readFileSync(cache, "utf8");
  const nameMatch = md.match(/^#\s+(.+)$/m);
  const priceMatch = md.match(/JD\s*[\d.,]+|\$\s*[\d.,]+/);
  const imgMatch = md.match(/!\[[^\]]*\]\((https:\/\/static\.wixstatic\.com\/[^)]+)\)/);
  if (!nameMatch || !imgMatch) return null;
  const imageUrl = imgMatch[1];
  const localImg = path.join(OUT_DIR, `${slug}.jpg`);
  if (!fs.existsSync(localImg)) await download(imageUrl, localImg);
  const product: Product = ProductSchema.parse({
    slug,
    name: nameMatch[1].trim(),
    brand,
    price: priceMatch?.[0],
    image_url: `/images/products/${slug}.jpg`,
    source_url: url,
    description: md.slice(0, 1200).replace(/\s+/g, " ").trim(),
  });
  return product;
}

async function main() {
  // Logo
  const logoUrl = "https://static.wixstatic.com/media/8dc97c_ff57b19dfebc473f8d1562a5edb3cf60~mv2.png";
  if (!fs.existsSync("public/logo.png")) await download(logoUrl, "public/logo.png");

  // Discover product URLs per brand
  const products: Product[] = [];
  for (const b of BRANDS) {
    const cache = `.firecrawl/brand-${b}.md`;
    if (!fs.existsSync(cache)) fc(`scrape "${ROOT}/${b}" -o ${cache} --format markdown`);
    const md = fs.readFileSync(cache, "utf8");
    const urls = Array.from(new Set(
      Array.from(md.matchAll(/\((https:\/\/www\.eightyfiveeleven\.com\/product-page\/[^\s)]+)\)/g)).map(m => m[1])
    ));
    for (const u of urls) {
      try {
        const p = await scrapeProductPage(u, BRAND_TO_KEY[b]);
        if (p) products.push(p);
      } catch (e) { console.warn("skip", u, e); }
    }
  }

  fs.writeFileSync("data/products.json", JSON.stringify(products, null, 2));
  console.log(`wrote ${products.length} products`);
}

main();
