import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const ProductSchema = z.object({
  slug: z.string(),
  name: z.string(),
  brand: z.enum(["nike", "adidas", "supreme", "hats"]),
  description: z.string(),
  category: z.enum(["sneaker", "cap", "bag", "beanie", "glove", "boot"]),
  price_jod: z.number().int(),
  sizes: z.array(z.string()),
  stock_status: z.enum(["in_stock", "low_stock", "sold_out"]),
});

const BRAND_LABEL: Record<z.infer<typeof ProductSchema>["brand"], string> = {
  nike: "Nike",
  adidas: "Adidas",
  supreme: "Supreme",
  hats: "Hats",
};

const STOCK_LABEL: Record<z.infer<typeof ProductSchema>["stock_status"], string> = {
  in_stock: "in stock",
  low_stock: "low stock",
  sold_out: "sold out",
};

type RagasSeedCase = {
  id: string;
  kind: "product";
  expected_slugs: string[];
  user_input: string;
  reference: string;
};

function productReference(p: z.infer<typeof ProductSchema>): string {
  return [
    `${p.name} is a ${BRAND_LABEL[p.brand]} ${p.category}.`,
    p.description,
    `It costs ${p.price_jod} JOD and is ${STOCK_LABEL[p.stock_status]}.`,
    `Available sizes: ${p.sizes.join(", ")}.`,
    `The exact product slug is ${p.slug}.`,
  ].join(" ");
}

const products = z.array(ProductSchema).parse(
  JSON.parse(fs.readFileSync("data/products.json", "utf8")),
);

const cases: RagasSeedCase[] = products.map((p) => ({
  id: `product:${p.slug}`,
  kind: "product",
  expected_slugs: [p.slug],
  user_input: `Tell me about ${p.name}.`,
  reference: productReference(p),
}));

const outDir = path.join("data", "ragas");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "eval-seed.json"),
  `${JSON.stringify(cases, null, 2)}\n`,
);

console.log(`Wrote ${cases.length} product eval cases to data/ragas/eval-seed.json`);
