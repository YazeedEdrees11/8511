import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { Document } from "@langchain/core/documents";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { GeminiMultimodalEmbeddings } from "../lib/rag/embeddings";
import { loadKB } from "../lib/catalog";

const ProductSchema = z.object({
  slug: z.string(),
  name: z.string(),
  brand: z.enum(["nike", "adidas", "supreme", "hats"]),
  image_url: z.string(),
  source_url: z.string(),
  description: z.string(),
  release_date: z.string().nullable(),
  category: z.enum(["sneaker", "cap", "bag", "beanie", "glove", "boot"]),
  price_jod: z.number().int(),
  size_system: z.enum(["us-adult-sneaker", "one-size", "size-m-l"]),
  sizes: z.array(z.string()),
  stock_status: z.enum(["in_stock", "low_stock", "sold_out"]),
});
type Product = z.infer<typeof ProductSchema>;

const BRAND_LABEL: Record<Product["brand"], string> = {
  nike: "Nike", adidas: "Adidas", supreme: "Supreme", hats: "hats",
};
const STOCK_LABEL: Record<Product["stock_status"], string> = {
  in_stock: "in stock", low_stock: "low stock", sold_out: "sold out",
};

function loadProductsJson(): Product[] {
  const raw = JSON.parse(fs.readFileSync("data/products.json", "utf8"));
  return z.array(ProductSchema).parse(raw);
}

function productPageContent(p: Product): string {
  const sizesLine = p.size_system === "one-size"
    ? "One size."
    : `Available sizes: ${p.sizes.join(", ")}.`;
  return [
    `${p.name} — ${BRAND_LABEL[p.brand]} ${p.category}.`,
    p.description,
    `Price: ${p.price_jod} JOD. Stock: ${STOCK_LABEL[p.stock_status]}.`,
    sizesLine,
    p.release_date ? `Released ${p.release_date}.` : null,
  ].filter(Boolean).join(" ");
}

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const embeddings = new GeminiMultimodalEmbeddings();

  const products = loadProductsJson();
  const kb = loadKB();
  console.log(`loaded ${products.length} products, ${kb.length} KB chunks`);

  const textDocs: Document[] = [
    ...products.map(p => new Document({
      pageContent: productPageContent(p),
      metadata: {
        kind: "product", modality: "text",
        slug: p.slug, name: p.name, brand: p.brand, category: p.category,
        price_jod: p.price_jod, stock_status: p.stock_status,
        sizes: p.sizes, size_system: p.size_system,
        release_date: p.release_date,
        image_url: p.image_url, source_url: p.source_url,
      },
    })),
    ...kb.map(c => new Document({
      pageContent: `${c.title}. ${c.text}`,
      metadata: { kind: "kb", modality: "text", id: c.id, type: c.type, title: c.title },
    })),
  ];

  console.log(`embedding ${textDocs.length} text documents...`);
  const store = await FaissStore.fromDocuments(textDocs, embeddings);

  console.log(`embedding ${products.length} product images...`);
  let imgOk = 0;
  for (const p of products) {
    const imgPath = path.join("public", p.image_url.replace(/^\//, ""));
    if (!fs.existsSync(imgPath)) { console.warn("no image for", p.slug); continue; }
    const bytes = fs.readFileSync(imgPath);
    let attempts = 0;
    let success = false;
    while (attempts < 5 && !success) {
      attempts++;
      try {
        const vec = await embeddings.embedImage(bytes);
        await store.addVectors(
          [vec],
          [new Document({
            pageContent: `[image of ${p.name}]`,
            metadata: {
              kind: "product", modality: "image",
              slug: p.slug, name: p.name, brand: p.brand, category: p.category,
              price_jod: p.price_jod, stock_status: p.stock_status,
              sizes: p.sizes, size_system: p.size_system,
              release_date: p.release_date,
              image_url: p.image_url, source_url: p.source_url,
            },
          })],
        );
        success = true;
        imgOk++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
        if (is429 && attempts < 5) {
          const wait = 30000 * attempts;
          console.warn(`rate limited on ${p.slug}, waiting ${wait}ms (attempt ${attempts}/5)`);
          await new Promise(r => setTimeout(r, wait));
        } else {
          console.warn("image embed failed for", p.slug, msg);
          break;
        }
      }
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log(`image vectors written: ${imgOk}/${products.length}`);

  fs.mkdirSync("data/faiss", { recursive: true });
  await store.save("data/faiss");
  console.log(`saved index to data/faiss (${textDocs.length} text + ${imgOk} image vectors, ${textDocs.length + imgOk} total)`);
}

main().catch(e => { console.error(e); process.exit(1); });
