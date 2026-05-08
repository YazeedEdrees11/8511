import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
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
  const seen = new Set<string>();
  const out: Document[] = [];
  for (const d of docs) {
    const id = (d.metadata as any).slug ?? (d.metadata as any).id ?? Math.random().toString();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(d);
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
  ]);
}
