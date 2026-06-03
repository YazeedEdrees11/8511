// scripts/ingest.ts — scrape the live Wix site into data/products.json
// Requires: firecrawl CLI installed and authenticated (no env var needed).
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { z } from "zod";

const ProductSchema = z.object({
  slug: z.string(),
  name: z.string(),
  brand: z.enum(["nike", "adidas", "supreme", "hats"]),
  price: z.string().optional(),
  image_url: z.string(),
  source_url: z.string(),
  description: z.string(),
});
type Product = z.infer<typeof ProductSchema>;

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

// Skip URLs that are part of the Wix site chrome (logo, social icons, store-locator pin).
const CHROME_HASHES = [
  "8dc97c_b8faeee65995449c90b259cf49c3c9b7", // header logo
  "8dc97c_ff57b19dfebc473f8d1562a5edb3cf60", // header logo cropped
  "Google%20Places",                          // store pin
  "22db839dd0a94a1c9dd91dafe2617dc1",         // store pin
  "b651bd_e352ff26257649e0825c0608596c5434",  // footer logo
];

function isChromeUrl(u: string): boolean {
  return CHROME_HASHES.some(h => u.includes(h));
}

async function scrapeProductPage(url: string, brand: Product["brand"]): Promise<Product | null> {
  const slug = slugifyFromUrl(url);
  const cache = `.firecrawl/product-${slug}.md`;
  if (!fs.existsSync(cache)) fc(`scrape "${url}" -o ${cache} --format markdown`);
  const md = fs.readFileSync(cache, "utf8");

  const nameMatch = md.match(/^#\s+(.+)$/m);
  if (!nameMatch) return null;
  const name = nameMatch[1].trim();

  // Pick the image whose alt text matches the product name. Wix renders this
  // as `![<product name>](<wix-cdn-url>)` immediately above the H1.
  const allImgs = Array.from(md.matchAll(/!\[([^\]]*)\]\((https:\/\/static\.wixstatic\.com\/[^)]+)\)/g));
  let imageUrl: string | undefined;
  for (const m of allImgs) {
    const [, alt, src] = m;
    if (isChromeUrl(src)) continue;
    if (alt.trim() && alt.trim().toLowerCase() === name.toLowerCase()) { imageUrl = src; break; }
  }
  // Fallback: first non-chrome image.
  if (!imageUrl) {
    for (const m of allImgs) { if (!isChromeUrl(m[2])) { imageUrl = m[2]; break; } }
  }
  if (!imageUrl) return null;

  // Description: take the body after the H1 line, drop nav/footer chrome lines, cap length.
  const headingIdx = md.indexOf(nameMatch[0]);
  const after = md.slice(headingIdx + nameMatch[0].length);
  const description = after
    .split("\n")
    .map(l => l.trim())
    .filter(l =>
      l &&
      !l.startsWith("![") &&
      !l.startsWith("[!") &&
      !/^Product Page:/i.test(l) &&
      !/^©\s*\d{4}/.test(l) &&
      !/^bottom of page$/i.test(l)
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);

  const priceMatch = md.match(/JD\s*[\d.,]+|\$\s*[\d.,]+/);

  const ext = imageUrl.match(/\.(jpe?g|png|webp)/i)?.[1]?.toLowerCase() ?? "jpg";
  const localImgName = `${slug}.${ext === "jpeg" ? "jpg" : ext}`;
  const localImg = path.join(OUT_DIR, localImgName);
  if (!fs.existsSync(localImg)) await download(imageUrl, localImg);

  const product: Product = ProductSchema.parse({
    slug,
    name,
    brand,
    price: priceMatch?.[0],
    image_url: `/images/products/${localImgName}`,
    source_url: url,
    description,
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
