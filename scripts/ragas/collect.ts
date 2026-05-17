import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { buildChain, retrieveDocs } from "../../lib/rag/chain";
import { GeminiMultimodalEmbeddings } from "../../lib/rag/embeddings";

const SeedCaseSchema = z.object({
  id: z.string(),
  kind: z.string(),
  expected_slugs: z.array(z.string()).optional(),
  user_input: z.string(),
  reference: z.string(),
});

type RagasRecord = {
  id: string;
  user_input: string;
  response: string;
  retrieved_contexts: string[];
  reference: string;
  expected_slugs?: string[];
};

async function streamToString(stream: AsyncIterable<unknown>): Promise<string> {
  let out = "";
  for await (const chunk of stream) out += String(chunk);
  return out;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  if (!process.env.HF_TOKEN) throw new Error("HF_TOKEN missing");

  const seedPath = process.argv[2] ?? path.join("data", "ragas", "eval-seed.json");
  const outPath = process.argv[3] ?? path.join("data", "ragas", "eval-run.jsonl");

  const seed = z.array(SeedCaseSchema).parse(
    JSON.parse(fs.readFileSync(seedPath, "utf8")),
  );

  const embeddings = new GeminiMultimodalEmbeddings();
  const store = await FaissStore.load("data/faiss", embeddings);
  const chain = await buildChain();

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, "");

  for (const [index, sample] of seed.entries()) {
    console.log(`[${index + 1}/${seed.length}] ${sample.id}`);
    const docs = await retrieveDocs(store, sample.user_input, "", { k: 10 });
    const response = await streamToString(
      await chain.stream({ question: sample.user_input, history: "" }),
    );

    const record: RagasRecord = {
      id: sample.id,
      user_input: sample.user_input,
      response,
      retrieved_contexts: docs.map((doc) => doc.pageContent),
      reference: sample.reference,
      expected_slugs: sample.expected_slugs,
    };
    fs.appendFileSync(outPath, `${JSON.stringify(record)}\n`);
  }

  console.log(`Wrote RAGAS input records to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
