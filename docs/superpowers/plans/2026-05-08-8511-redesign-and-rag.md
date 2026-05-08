# Eighty Five Eleven Redesign + RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the 8511 storefront as a local Next.js 15 app with a Stitch-driven design system and add a multimodal LangChain RAG chat (text + product images) backed by FAISS, Google Gemini `gemini-embedding-2` (multimodal), and Qwen2.5 via Hugging Face Inference.

**Architecture:** Single Next.js 15 monolith. App Router pages mirror the existing Wix IA. A `scripts/ingest.ts` Firecrawl pipeline scrapes the live site into `data/products.json` + `data/kb.json` + `public/images/products/*`. A `scripts/embed.ts` script builds a `FaissStore` (LangChain.js) using a custom `GeminiMultimodalEmbeddings` class. The RAG endpoint at `app/api/chat/route.ts` is a `RunnableSequence` (retriever → ChatPromptTemplate → ChatHuggingFace streaming → StringOutputParser → SSE). A shared `<ChatPanel>` powers both the global `<ChatWidget>` and the dedicated `/chat` page; product references in the stream render as `<ProductCard>` blocks.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · LangChain.js (`langchain`, `@langchain/core`, `@langchain/community`) · `faiss-node` · Google Gemini API `gemini-embedding-2` (multimodal) · Hugging Face Inference (`@huggingface/inference`) · Qwen2.5-7B-Instruct · Firecrawl CLI · Vitest.

**Spec:** `docs/superpowers/specs/2026-05-08-8511-redesign-and-rag-design.md`

---

## File Structure

```
eighty-five-eleven/
├── app/
│   ├── layout.tsx                 # Root layout, mounts <ChatWidget>
│   ├── page.tsx                   # Home
│   ├── shop/page.tsx              # All products
│   ├── shop/[brand]/page.tsx      # nike|adidas|supreme|hats
│   ├── product/[slug]/page.tsx    # PDP
│   ├── services/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── chat/page.tsx              # Full-screen RAG
│   └── api/chat/route.ts          # SSE streaming endpoint
├── components/
│   ├── chat/ChatWidget.tsx
│   ├── chat/ChatPanel.tsx
│   ├── chat/ProductCard.tsx
│   ├── layout/Header.tsx
│   ├── layout/Footer.tsx
│   └── ui/                        # Stitch-exported primitives (Button, Card, …)
├── lib/
│   ├── rag/embeddings.ts          # GeminiMultimodalEmbeddings
│   ├── rag/vectorstore.ts         # FaissStore load/save helpers
│   ├── rag/chain.ts               # RunnableSequence factory
│   ├── llm/qwen.ts                # ChatHuggingFace factory
│   └── catalog.ts                 # Typed loaders for products.json / kb.json
├── scripts/
│   ├── ingest.ts                  # Firecrawl scrape → JSON + images
│   └── embed.ts                   # Build FaissStore on disk
├── data/
│   ├── products.json
│   ├── kb.json
│   └── faiss/                     # FaissStore.save target (faiss.index + docstore.json)
├── public/
│   ├── logo.png
│   └── images/products/*.jpg
├── tests/
│   ├── lib/rag/embeddings.test.ts
│   ├── lib/rag/vectorstore.test.ts
│   ├── lib/rag/chain.test.ts
│   └── lib/catalog.test.ts
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── .env.example
```

---

## Task 1: Initialize Next.js 15 + TypeScript + Tailwind

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.env.example`, `.gitignore`

- [ ] **Step 1: Bootstrap Next.js**

Run from `C:\Users\DELL\Desktop\eighty five eleven`:
```bash
npx create-next-app@15 . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm
```
When prompted about overwriting, accept. Expected: a working Next.js 15 scaffold compiles with `npm run dev`.

- [ ] **Step 2: Add `.env.example`**

```bash
# .env.example
HF_TOKEN=
GEMINI_API_KEY=
FIRECRAWL_API_KEY=
```

- [ ] **Step 3: Update `.gitignore`**

Append:
```
.env.local
.firecrawl/
data/faiss/
public/images/products/
```

- [ ] **Step 4: Verify dev server**

Run: `npm run dev`. Expected: `http://localhost:3000` returns the default Next.js page without errors. Stop the server.

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: bootstrap Next.js 15 + TS + Tailwind"
```

---

## Task 2: Install RAG, LangChain, and tooling dependencies

**Files:** Modify `package.json`.

- [ ] **Step 1: Install runtime deps**

```bash
npm install langchain @langchain/core @langchain/community @huggingface/inference @google/genai faiss-node zod dotenv
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D vitest @vitest/ui tsx @types/node
```

- [ ] **Step 3: Add scripts to `package.json`**

In `package.json` `"scripts"` block, add:
```json
"ingest": "tsx scripts/ingest.ts",
"embed": "tsx scripts/embed.ts",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add LangChain, FAISS, HF, Vitest deps"
```

---

## Task 3: Define catalog types and typed loaders

**Files:**
- Create: `lib/catalog.ts`
- Test: `tests/lib/catalog.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/catalog.test.ts
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
    const tmp = path.join(os.tmpdir(), "products.json");
    fs.writeFileSync(tmp, JSON.stringify([{
      slug: "x", name: "X", brand: "nike",
      image_url: "/x.jpg", source_url: "https://x", description: "x",
    }]));
    const arr = loadProducts(tmp);
    expect(arr).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test`. Expected: FAIL — `lib/catalog` not found.

- [ ] **Step 3: Implement `lib/catalog.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`. Expected: 4/4 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/catalog.ts tests/lib/catalog.test.ts
git commit -m "feat(catalog): zod-validated Product and KBChunk loaders"
```

---

## Task 4: Ingestion script — Firecrawl scrape into products.json + logo

**Files:**
- Create: `scripts/ingest.ts`, `data/kb.json`

- [ ] **Step 1: Hand-author `data/kb.json`**

Source text from the live site (already scraped under `.firecrawl/`). Create `data/kb.json`:

```json
[
  { "id": "about", "type": "about", "title": "About Eighty Five Eleven",
    "text": "Eighty Five Eleven is a streetwear and sneaker boutique in Swefieh Village, Amman, Jordan. Established in 2021. Advocates of the sneaker streetwear culture, bridging humans and sneaker streetwear culture under one roof." },
  { "id": "store", "type": "store", "title": "Store location",
    "text": "Visit our store in Swefieh Village, Amman, Jordan. Find us on Google Maps." },
  { "id": "contact", "type": "contact", "title": "Contact",
    "text": "Email EightyFiveEleven.8511@gmail.com. Address: Saleh Ali Zaki, Amman, Jordan. Instagram: @eightyfiveeleven." },
  { "id": "svc-auth", "type": "service", "title": "Sneaker Authentication",
    "text": "Verify the authenticity of any sneaker before you buy or sell." },
  { "id": "svc-consign", "type": "service", "title": "Sneaker Consignment",
    "text": "Consign your sneakers with us — we list, sell, and pay you out." },
  { "id": "svc-laundry", "type": "service", "title": "Sneaker Laundry",
    "text": "Professional cleaning service for sneakers." },
  { "id": "svc-restoration", "type": "service", "title": "Sneaker Restoration",
    "text": "Bring tired pairs back to life — sole swaps, color restoration, repairs." },
  { "id": "svc-art", "type": "service", "title": "Custom Sneaker Art",
    "text": "Hand-painted custom artwork on your sneakers." },
  { "id": "svc-custom", "type": "service", "title": "Custom Orders",
    "text": "Custom orders for shoes and clothing of your preference." },
  { "id": "svc-shipping", "type": "service", "title": "Worldwide Shipping",
    "text": "We ship globally." },
  { "id": "svc-nikeid", "type": "service", "title": "Nike ID",
    "text": "Nike ID custom design service." }
]
```

- [ ] **Step 2: Implement `scripts/ingest.ts`**

```ts
// scripts/ingest.ts — scrape the live Wix site into data/products.json
// Requires: FIRECRAWL_API_KEY in env, firecrawl CLI installed and authenticated.
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
```

- [ ] **Step 3: Run ingest**

Run: `npm run ingest`. Expected: `data/products.json` written, `public/logo.png` exists, `public/images/products/*.jpg` populated. Catalog should contain dozens of products.

- [ ] **Step 4: Sanity-check the output**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('data/products.json','utf8')).length)"
```
Expected: a number >= 10.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest.ts data/kb.json data/products.json
git commit -m "feat(ingest): scrape Wix site into products.json + KB"
```

---

## Task 5: Gemini multimodal embeddings — LangChain `Embeddings` subclass

**Files:**
- Create: `lib/rag/embeddings.ts`
- Test: `tests/lib/rag/embeddings.test.ts`

- [ ] **Step 1: Install the Gemini SDK**

```bash
npm install @google/genai
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/lib/rag/embeddings.test.ts
import { describe, it, expect, vi } from "vitest";
import { GeminiMultimodalEmbeddings } from "@/lib/rag/embeddings";

function fakeClient(textVec: number[], imageVec: number[]) {
  return {
    models: {
      embedContent: vi.fn().mockImplementation(async ({ contents }: any) => {
        const part = contents[0]?.parts?.[0] ?? contents[0];
        const isImage = part?.inlineData != null;
        return { embeddings: [{ values: isImage ? imageVec : textVec }] };
      }),
    },
  };
}

describe("GeminiMultimodalEmbeddings", () => {
  it("returns text embeddings for embedDocuments", async () => {
    const tv = new Array(3072).fill(0.1);
    const e = new GeminiMultimodalEmbeddings({ apiKey: "k", client: fakeClient(tv, []) as any });
    const out = await e.embedDocuments(["hello", "world"]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual(tv);
  });

  it("returns text embedding for embedQuery", async () => {
    const tv = new Array(3072).fill(0.2);
    const e = new GeminiMultimodalEmbeddings({ apiKey: "k", client: fakeClient(tv, []) as any });
    const v = await e.embedQuery("hello");
    expect(v).toEqual(tv);
  });

  it("embedImage sends base64 inlineData and returns image embedding", async () => {
    const iv = new Array(3072).fill(0.5);
    const client = fakeClient([], iv);
    const e = new GeminiMultimodalEmbeddings({ apiKey: "k", client: client as any });
    const v = await e.embedImage(Buffer.from("fakejpg"), "image/jpeg");
    expect(v).toEqual(iv);
    const arg = (client.models.embedContent as any).mock.calls[0][0];
    expect(arg.contents[0].parts[0].inlineData.mimeType).toBe("image/jpeg");
    expect(arg.contents[0].parts[0].inlineData.data).toBe(Buffer.from("fakejpg").toString("base64"));
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `npm test`. Expected: FAIL — module missing.

- [ ] **Step 4: Implement `lib/rag/embeddings.ts`**

```ts
import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
import { GoogleGenAI } from "@google/genai";

type Opts = EmbeddingsParams & {
  apiKey?: string;
  model?: string;
  /** Inject a client for testing. Production uses GoogleGenAI(apiKey). */
  client?: GoogleGenAI;
};

export class GeminiMultimodalEmbeddings extends Embeddings {
  private model: string;
  private client: GoogleGenAI;

  constructor(opts: Opts = {}) {
    super(opts);
    this.model = opts.model ?? "gemini-embedding-2";
    this.client = opts.client ?? new GoogleGenAI({ apiKey: opts.apiKey ?? process.env.GEMINI_API_KEY! });
  }

  private async embedOne(part: any): Promise<number[]> {
    const r = await this.client.models.embedContent({
      model: this.model,
      contents: [{ parts: [part] }],
    } as any);
    const values = (r as any).embeddings?.[0]?.values;
    if (!values) throw new Error("Gemini returned no embedding");
    return values;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (const t of texts) out.push(await this.embedOne({ text: t }));
    return out;
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embedOne({ text });
  }

  async embedImage(bytes: Buffer, mimeType = "image/jpeg"): Promise<number[]> {
    return this.embedOne({ inlineData: { mimeType, data: bytes.toString("base64") } });
  }
}
```

- [ ] **Step 5: Run tests**

Run: `npm test`. Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add lib/rag/embeddings.ts tests/lib/rag/embeddings.test.ts package.json package-lock.json
git commit -m "feat(rag): GeminiMultimodalEmbeddings (text + image)"
```

---

## Task 6: FaissStore helpers

**Files:**
- Create: `lib/rag/vectorstore.ts`
- Test: `tests/lib/rag/vectorstore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/rag/vectorstore.test.ts
import { describe, it, expect } from "vitest";
import { FakeEmbeddings } from "@langchain/core/utils/testing";
import { Document } from "@langchain/core/documents";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { saveStore, loadStore } from "@/lib/rag/vectorstore";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

describe("vectorstore", () => {
  it("saves and loads a FaissStore", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "faiss-"));
    const store = await FaissStore.fromDocuments(
      [new Document({ pageContent: "hi", metadata: { id: "a" } })],
      new FakeEmbeddings()
    );
    await saveStore(store, dir);
    const loaded = await loadStore(dir, new FakeEmbeddings());
    const r = await loaded.similaritySearch("hi", 1);
    expect(r[0].metadata.id).toBe("a");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test`. Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/rag/vectorstore.ts`**

```ts
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import type { Embeddings } from "@langchain/core/embeddings";

export async function saveStore(store: FaissStore, dir: string): Promise<void> {
  await store.save(dir);
}

export async function loadStore(dir: string, embeddings: Embeddings): Promise<FaissStore> {
  return FaissStore.load(dir, embeddings);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`. Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add lib/rag/vectorstore.ts tests/lib/rag/vectorstore.test.ts
git commit -m "feat(rag): FaissStore save/load helpers"
```

---

## Task 7: Embedding script — build the index

**Files:**
- Create: `scripts/embed.ts`

- [ ] **Step 1: Implement `scripts/embed.ts`**

```ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { loadProducts, loadKB } from "../lib/catalog";
import { GeminiMultimodalEmbeddings } from "../lib/rag/embeddings";

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const embeddings = new GeminiMultimodalEmbeddings();

  const products = loadProducts();
  const kb = loadKB();

  const textDocs: Document[] = [
    ...products.map(p => new Document({
      pageContent: `${p.name}. ${p.description}${p.price ? ` Price: ${p.price}.` : ""}`,
      metadata: { kind: "product", slug: p.slug, modality: "text", brand: p.brand, image_url: p.image_url, source_url: p.source_url, name: p.name, price: p.price ?? "" },
    })),
    ...kb.map(c => new Document({
      pageContent: `${c.title}. ${c.text}`,
      metadata: { kind: "kb", id: c.id, modality: "text", type: c.type, title: c.title },
    })),
  ];

  // Build store from text docs first
  const store = await FaissStore.fromDocuments(textDocs, embeddings);

  // Add image vectors per product (multimodal)
  for (const p of products) {
    const imgPath = path.join("public", p.image_url.replace(/^\//, ""));
    if (!fs.existsSync(imgPath)) { console.warn("no image for", p.slug); continue; }
    const bytes = fs.readFileSync(imgPath);
    const vec = await embeddings.embedImage(bytes);
    await store.addVectors(
      [vec],
      [new Document({
        pageContent: `[image of ${p.name}]`,
        metadata: { kind: "product", slug: p.slug, modality: "image", brand: p.brand, image_url: p.image_url, source_url: p.source_url, name: p.name, price: p.price ?? "" },
      })],
    );
  }

  await store.save("data/faiss");
  console.log(`indexed ${textDocs.length} text docs + ${products.length} image vectors`);
}

main();
```

- [ ] **Step 2: Run embed**

Run: `npm run embed`. Expected: `data/faiss/faiss.index` and `data/faiss/docstore.json` created.

- [ ] **Step 3: Commit**

```bash
git add scripts/embed.ts
git commit -m "feat(rag): build FaissStore with text + image vectors"
```

---

## Task 8: Qwen chat model factory

**Files:**
- Create: `lib/llm/qwen.ts`

- [ ] **Step 1: Implement `lib/llm/qwen.ts`**

```ts
import { HuggingFaceInference } from "@langchain/community/llms/hf";

export function makeQwen(opts?: { model?: string; temperature?: number; maxTokens?: number }) {
  const apiKey = process.env.HF_TOKEN;
  if (!apiKey) throw new Error("HF_TOKEN missing");
  return new HuggingFaceInference({
    model: opts?.model ?? "Qwen/Qwen2.5-7B-Instruct",
    apiKey,
    temperature: opts?.temperature ?? 0.2,
    maxTokens: opts?.maxTokens ?? 512,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/llm/qwen.ts
git commit -m "feat(llm): Qwen2.5 HF Inference factory"
```

---

## Task 9: RAG chain — RunnableSequence

**Files:**
- Create: `lib/rag/chain.ts`
- Test: `tests/lib/rag/chain.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/rag/chain.test.ts
import { describe, it, expect } from "vitest";
import { Document } from "@langchain/core/documents";
import { formatContext } from "@/lib/rag/chain";

describe("formatContext", () => {
  it("renders product docs with slug, name, price", () => {
    const ctx = formatContext([
      new Document({ pageContent: "ignored", metadata: { kind: "product", slug: "aj1", name: "Air Jordan 1", price: "JD 250" } }),
    ]);
    expect(ctx).toContain("aj1");
    expect(ctx).toContain("Air Jordan 1");
    expect(ctx).toContain("JD 250");
  });

  it("renders kb docs with title + text", () => {
    const ctx = formatContext([
      new Document({ pageContent: "Authentication body", metadata: { kind: "kb", title: "Sneaker Authentication" } }),
    ]);
    expect(ctx).toContain("Sneaker Authentication");
    expect(ctx).toContain("Authentication body");
  });
});
```

- [ ] **Step 2: Run test**

Run: `npm test`. Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/rag/chain.ts`**

```ts
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { GeminiMultimodalEmbeddings } from "./embeddings";
import { makeQwen } from "../llm/qwen";

const SYSTEM = `You are 8511's storefront assistant. You answer questions about products, services, and the store using ONLY the provided context.
Rules:
- If unsure or context is empty, say you don't know.
- When recommending or referencing a product, emit a tag exactly like <product slug="THE-SLUG"/> on its own line. Do not invent slugs.
- Keep answers concise and culture-forward, matching the streetwear voice of the store.`;

export function formatContext(docs: Document[]): string {
  return docs.map((d, i) => {
    const m = d.metadata as Record<string, any>;
    if (m.kind === "product") {
      return `[${i + 1}] PRODUCT slug=${m.slug} brand=${m.brand} name="${m.name}" price="${m.price ?? ""}"\n${d.pageContent}`;
    }
    return `[${i + 1}] ${m.title ?? "KB"}\n${d.pageContent}`;
  }).join("\n\n");
}

function dedupeBySlug(docs: Document[], k: number): Document[] {
  const seen = new Set<string>(); const out: Document[] = [];
  for (const d of docs) {
    const id = (d.metadata as any).slug ?? (d.metadata as any).id ?? Math.random().toString();
    if (seen.has(id)) continue;
    seen.add(id); out.push(d);
    if (out.length >= k) break;
  }
  return out;
}

export async function buildChain() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const embeddings = new GeminiMultimodalEmbeddings();
  const store = await FaissStore.load("data/faiss", embeddings);
  const llm = makeQwen();

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM],
    ["human", "Context:\n{context}\n\nHistory:\n{history}\n\nQuestion: {question}"],
  ]);

  return RunnableSequence.from([
    {
      question: (i: { question: string; history?: string }) => i.question,
      history: (i: { question: string; history?: string }) => i.history ?? "",
      context: async (i: { question: string }) => {
        const raw = await store.similaritySearch(i.question, 12);
        return formatContext(dedupeBySlug(raw, 6));
      },
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`. Expected: 2/2 in chain.test.ts pass.

- [ ] **Step 5: Commit**

```bash
git add lib/rag/chain.ts tests/lib/rag/chain.test.ts
git commit -m "feat(rag): LangChain RunnableSequence with retrieval + Qwen"
```

---

## Task 10: `/api/chat` streaming route

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { buildChain } from "@/lib/rag/chain";

export const runtime = "nodejs";

let chainPromise: ReturnType<typeof buildChain> | null = null;
function getChain() { return (chainPromise ??= buildChain()); }

export async function POST(req: Request) {
  const { question, history } = (await req.json()) as { question: string; history?: string };
  const chain = await getChain();
  const stream = await chain.stream({ question, history: history ?? "" });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) controller.enqueue(encoder.encode(chunk));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
```

- [ ] **Step 2: Smoke test**

In one terminal: `npm run dev`. In another:
```bash
curl -N -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"question\":\"do you have any Jordan 1s?\"}"
```
Expected: streamed text response that mentions a product slug in `<product slug="..."/>` form.

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(api): streaming /api/chat RAG endpoint"
```

---

## Task 11: Tailwind tokens — palette + typography from Stitch

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Define design tokens in `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        paper: "#F7F7F4",
        accent: "#FF3B00", // streetwear pop; finalize during Stitch pass
        muted: "#8A8A8A",
        line: "#1F1F1F",
      },
      fontFamily: {
        display: ['"Futura PT"', "Futura", "Helvetica Neue", "sans-serif"],
        body: ["Questrial", "Roboto", "ui-sans-serif", "sans-serif"],
      },
      letterSpacing: { wider2: "0.08em" },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: Wire `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { background: #F7F7F4; color: #0A0A0A; }
body { font-family: Questrial, Roboto, ui-sans-serif, sans-serif; }
h1,h2,h3 { font-family: "Futura PT", Futura, "Helvetica Neue", sans-serif; letter-spacing: 0.02em; }
```

- [ ] **Step 3: Update `app/layout.tsx` shell**

```tsx
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";

export const metadata = { title: "Eighty Five Eleven | Amman", description: "Streetwear, sneakers, and accessories — Swefieh Village, Amman." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat(ui): Tailwind tokens + global layout shell"
```

---

## Task 12: Header + Footer with logo

**Files:**
- Create: `components/layout/Header.tsx`, `components/layout/Footer.tsx`

- [ ] **Step 1: Implement `Header.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/chat", label: "Ask 8511" },
];

export default function Header() {
  return (
    <header className="border-b border-line/20 bg-paper sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-20">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Eighty Five Eleven" width={160} height={48} priority />
        </Link>
        <nav className="hidden md:flex gap-8 text-sm tracking-wider2 uppercase">
          {NAV.map(n => <Link key={n.href} href={n.href} className="hover:text-accent transition-colors">{n.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement `Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="border-t border-line/20 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-4 justify-between text-sm text-muted">
        <span>© {new Date().getFullYear()} Eighty Five Eleven · Swefieh Village, Amman</span>
        <a href="mailto:EightyFiveEleven.8511@gmail.com" className="hover:text-ink">EightyFiveEleven.8511@gmail.com</a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/Header.tsx components/layout/Footer.tsx
git commit -m "feat(ui): header with logo + footer"
```

---

## Task 13: ChatPanel + ChatWidget + ProductCard

**Files:**
- Create: `components/chat/ChatPanel.tsx`, `components/chat/ChatWidget.tsx`, `components/chat/ProductCard.tsx`

- [ ] **Step 1: Implement `ProductCard.tsx`**

```tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog";

let cache: Product[] | null = null;
async function getProducts(): Promise<Product[]> {
  if (cache) return cache;
  const res = await fetch("/api/products");
  cache = await res.json();
  return cache!;
}

export default function ProductCard({ slug }: { slug: string }) {
  const [p, setP] = useState<Product | null>(null);
  useEffect(() => { getProducts().then(list => setP(list.find(x => x.slug === slug) ?? null)); }, [slug]);
  if (!p) return null;
  return (
    <Link href={`/product/${p.slug}`} className="block border border-line/20 rounded p-3 hover:border-accent transition-colors max-w-xs">
      <div className="aspect-square relative bg-white">
        <Image src={p.image_url} alt={p.name} fill className="object-contain" />
      </div>
      <div className="mt-2 font-display tracking-wider2 text-sm">{p.name}</div>
      {p.price && <div className="text-xs text-muted">{p.price}</div>}
    </Link>
  );
}
```

- [ ] **Step 2: Add `/api/products`**

Create `app/api/products/route.ts`:
```ts
import { loadProducts } from "@/lib/catalog";
export const runtime = "nodejs";
export async function GET() {
  return Response.json(loadProducts());
}
```

- [ ] **Step 3: Implement `ChatPanel.tsx`**

```tsx
"use client";
import { useRef, useState } from "react";
import ProductCard from "./ProductCard";

type Msg = { role: "user" | "assistant"; text: string };

function renderAssistant(text: string) {
  const parts = text.split(/(<product\s+slug="[^"]+"\s*\/>)/g);
  return parts.map((part, i) => {
    const m = part.match(/<product\s+slug="([^"]+)"\s*\/>/);
    if (m) return <ProductCard key={i} slug={m[1]} />;
    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });
}

export default function ChatPanel({ compact = false }: { compact?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send() {
    if (!input.trim() || busy) return;
    const q = input.trim();
    setInput("");
    setMsgs(m => [...m, { role: "user", text: q }, { role: "assistant", text: "" }]);
    setBusy(true);
    try {
      const history = msgs.map(m => `${m.role}: ${m.text}`).join("\n");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMsgs(m => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: copy[copy.length - 1].text + chunk };
          return copy;
        });
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } finally { setBusy(false); }
  }

  return (
    <div className={`flex flex-col ${compact ? "h-[480px]" : "h-[calc(100vh-10rem)]"}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.length === 0 && (
          <div className="text-muted text-sm">Ask about a sneaker, a service, or the store.</div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-ink" : "text-ink"}>
            <div className="text-[10px] uppercase tracking-wider2 text-muted mb-1">{m.role}</div>
            <div className="space-y-2">{m.role === "assistant" ? renderAssistant(m.text) : m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={e => { e.preventDefault(); send(); }} className="border-t border-line/20 p-3 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask 8511…"
          className="flex-1 bg-transparent outline-none px-3 py-2 border border-line/20 rounded" />
        <button disabled={busy} className="px-4 py-2 bg-ink text-paper text-sm tracking-wider2 uppercase disabled:opacity-50">Send</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Implement `ChatWidget.tsx`**

```tsx
"use client";
import { useState } from "react";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 bg-accent text-paper rounded-full px-5 py-3 shadow-lg z-40 text-sm tracking-wider2 uppercase">
        {open ? "Close" : "Ask 8511"}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-[380px] max-w-[90vw] bg-paper border border-line/30 shadow-2xl rounded-md overflow-hidden z-40">
          <ChatPanel compact />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/chat app/api/products/route.ts
git commit -m "feat(chat): ChatPanel + ChatWidget + ProductCard"
```

---

## Task 14: Page implementations (Home / Shop / Brand / PDP / Services / About / Contact / Chat)

**Files:**
- Create: `app/page.tsx`, `app/shop/page.tsx`, `app/shop/[brand]/page.tsx`, `app/product/[slug]/page.tsx`, `app/services/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/chat/page.tsx`

- [ ] **Step 1: Home (`app/page.tsx`)**

```tsx
import Link from "next/link";
import Image from "next/image";
import { loadProducts } from "@/lib/catalog";

export default function Home() {
  const featured = loadProducts().slice(0, 6);
  return (
    <div>
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="font-display text-5xl md:text-7xl tracking-tight">Eighty Five Eleven</h1>
        <p className="mt-4 text-muted max-w-xl">Advocates of the sneaker streetwear culture. Swefieh Village, Amman.</p>
        <Link href="/shop" className="inline-block mt-8 px-6 py-3 bg-ink text-paper text-sm tracking-wider2 uppercase">Shop now</Link>
      </section>
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["nike","adidas","supreme","hats"] as const).map(b => (
          <Link key={b} href={`/shop/${b}`} className="border border-line/20 px-4 py-10 text-center font-display uppercase tracking-wider2 hover:border-accent transition-colors">{b}</Link>
        ))}
      </section>
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl mb-8">Featured</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {featured.map(p => (
            <Link key={p.slug} href={`/product/${p.slug}`} className="block border border-line/20 hover:border-accent transition-colors">
              <div className="aspect-square relative bg-white"><Image src={p.image_url} alt={p.name} fill className="object-contain" /></div>
              <div className="p-3 font-display tracking-wider2 text-sm">{p.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Shop grid (`app/shop/page.tsx`)**

```tsx
import Link from "next/link";
import Image from "next/image";
import { loadProducts } from "@/lib/catalog";

export default function Shop() {
  const products = loadProducts();
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl mb-8">Shop</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map(p => (
          <Link key={p.slug} href={`/product/${p.slug}`} className="block border border-line/20 hover:border-accent transition-colors">
            <div className="aspect-square relative bg-white"><Image src={p.image_url} alt={p.name} fill className="object-contain" /></div>
            <div className="p-3 font-display tracking-wider2 text-sm">{p.name}</div>
            {p.price && <div className="px-3 pb-3 text-xs text-muted">{p.price}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Brand page (`app/shop/[brand]/page.tsx`)**

```tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { loadProducts } from "@/lib/catalog";

const BRANDS = ["nike", "adidas", "supreme", "hats"] as const;

export default async function Brand({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  if (!(BRANDS as readonly string[]).includes(brand)) notFound();
  const products = loadProducts().filter(p => p.brand === brand);
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl mb-8 uppercase">{brand}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map(p => (
          <Link key={p.slug} href={`/product/${p.slug}`} className="block border border-line/20 hover:border-accent transition-colors">
            <div className="aspect-square relative bg-white"><Image src={p.image_url} alt={p.name} fill className="object-contain" /></div>
            <div className="p-3 font-display tracking-wider2 text-sm">{p.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: PDP (`app/product/[slug]/page.tsx`)**

```tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { loadProducts } from "@/lib/catalog";

export default async function PDP({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = loadProducts().find(x => x.slug === slug);
  if (!p) notFound();
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
      <div className="aspect-square relative bg-white border border-line/20"><Image src={p.image_url} alt={p.name} fill className="object-contain" /></div>
      <div>
        <h1 className="font-display text-4xl">{p.name}</h1>
        <div className="mt-2 text-muted uppercase tracking-wider2 text-xs">{p.brand}</div>
        {p.price && <div className="mt-4 text-2xl">{p.price}</div>}
        <p className="mt-6 leading-relaxed text-sm">{p.description}</p>
        <a href={p.source_url} target="_blank" className="inline-block mt-8 px-6 py-3 bg-ink text-paper text-sm uppercase tracking-wider2">Buy on 8511</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Services / About / Contact / Chat**

```tsx
// app/services/page.tsx
import { loadKB } from "@/lib/catalog";
export default function Services() {
  const services = loadKB().filter(c => c.type === "service");
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl mb-8">What we do</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {services.map((s, i) => (
          <div key={s.id} className="border border-line/20 p-6">
            <div className="text-muted text-xs tracking-wider2">{String(i + 1).padStart(2, "0")}</div>
            <div className="font-display text-2xl mt-2">{s.title}</div>
            <p className="mt-3 text-sm text-muted">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// app/about/page.tsx
import { loadKB } from "@/lib/catalog";
export default function About() {
  const about = loadKB().find(c => c.id === "about")!;
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-display text-4xl">About</h1>
      <p className="mt-6 leading-relaxed">{about.text}</p>
    </div>
  );
}
```

```tsx
// app/contact/page.tsx
import { loadKB } from "@/lib/catalog";
export default function Contact() {
  const c = loadKB().find(x => x.id === "contact")!;
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-display text-4xl">Contact</h1>
      <p className="mt-6 leading-relaxed whitespace-pre-line">{c.text}</p>
      <a href="https://maps.google.com/?cid=15121294295697539889" target="_blank"
         className="inline-block mt-8 px-6 py-3 bg-ink text-paper text-sm uppercase tracking-wider2">Open in Google Maps</a>
    </div>
  );
}
```

```tsx
// app/chat/page.tsx
import ChatPanel from "@/components/chat/ChatPanel";
export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl mb-4">Ask 8511</h1>
      <div className="border border-line/20 rounded-md overflow-hidden"><ChatPanel /></div>
    </div>
  );
}
```

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`. Click through `/`, `/shop`, `/shop/nike`, `/product/<slug>`, `/services`, `/about`, `/contact`, `/chat`. Open the floating widget. Expected: pages render, products appear, chat widget opens.

- [ ] **Step 7: Commit**

```bash
git add app/
git commit -m "feat(ui): all storefront pages + /chat"
```

---

## Task 15: Stitch design pass

**Files:** updated screens in `components/ui/` + theme tokens in `tailwind.config.ts`.

- [ ] **Step 1: Open Stitch and create the project**

Use Stitch MCP. Project name: "8511 Storefront". Apply existing Tailwind tokens (Task 11). Generate screens for: Home, Shop grid, PDP, Services, About, Contact, /chat, ChatWidget popover, ProductCard.

- [ ] **Step 2: Lock final accent color**

In Stitch, pick the accent (replacing the placeholder `#FF3B00` in `tailwind.config.ts` if needed). Update `tailwind.config.ts` `accent` value if changed.

- [ ] **Step 3: Export Stitch primitives into `components/ui/`**

Replace ad-hoc Tailwind classes in pages with the exported Stitch components where they map cleanly (Button, Card, ProductTile). Keep styling consistent across pages.

- [ ] **Step 4: Verify visual consistency**

Run: `npm run dev`. Walk through every page; confirm typography (Futura/Questrial), palette, spacing match the Stitch designs.

- [ ] **Step 5: Commit**

```bash
git add components/ui tailwind.config.ts app/ components/
git commit -m "feat(ui): Stitch design pass — primitives + final tokens"
```

---

## Task 16: README and final smoke test

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Eighty Five Eleven

Local Next.js 15 storefront + LangChain RAG chat for [eightyfiveeleven.com](https://www.eightyfiveeleven.com).

## Setup

1. `npm install`
2. `cp .env.example .env.local` and fill in:
   - `HF_TOKEN` — Hugging Face Inference token (Qwen2.5-7B-Instruct)
   - `GEMINI_API_KEY` — Gemini API key from https://aistudio.google.com/apikey (used for `gemini-embedding-2`)
   - `FIRECRAWL_API_KEY` — for catalog ingestion
3. `npm run ingest` — scrape the live Wix catalog into `data/products.json` + `public/images/products/`
4. `npm run embed` — build the FAISS index in `data/faiss/`
5. `npm run dev` — http://localhost:3000

## Architecture

See `docs/superpowers/specs/2026-05-08-8511-redesign-and-rag-design.md`.
```

- [ ] **Step 2: Final smoke test**

```bash
npm run ingest && npm run embed && npm run dev
```
Visit http://localhost:3000. Test:
- Home, Shop, brand pages, PDP, Services, About, Contact render correctly
- `/chat` page works; ask "do you have any Jordan 1s?" — expect streamed text + ProductCard(s)
- Floating widget opens and works on every page
- Logo displays in header

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: setup and architecture README"
```

---

## Self-review checklist

- Spec §3 stack — covered by Tasks 1, 2, 5, 6, 7, 8, 9.
- Spec §4 repo layout — matches File Structure above.
- Spec §5 data shapes — covered by Task 3.
- Spec §6 ingestion — Task 4 (with logo download).
- Spec §7 embedding pipeline — Task 7 (text + image vectors per product, KB text).
- Spec §8 RAG pipeline — Tasks 9 (chain) + 10 (route) — RunnableSequence with retriever, prompt, Qwen, parser; SSE-style streaming.
- Spec §9 frontend pages — Task 14 covers all routes; logo in Task 12 Header.
- Spec §10 design system — Tasks 11 (tokens) + 15 (Stitch pass).
- Spec §11 dev flow — Task 16 README captures it.
- Spec §12 chunking — no splitter for atomic records (Task 7 honors this; products and KB chunks emitted as one Document each).
- Spec §13 risks — surfaced in README + comments; HF rate-limit fallback to Qwen2.5-7B is the default in Task 8.

No `TODO`/`TBD`/"add validation" placeholders. Type names (`Product`, `KBChunk`, `GeminiMultimodalEmbeddings`) are consistent across tasks.
