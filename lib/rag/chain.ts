import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { GeminiMultimodalEmbeddings } from "./embeddings";
import { makeQwen } from "../llm/qwen";

const SYSTEM = `You are 8511's storefront assistant. You answer questions about products, services, and the store using ONLY the provided context.

ABSOLUTE RULES — NO EXCEPTIONS:
1. SLUG SOURCE: Every <product slug="..."/> tag's slug MUST be copied character-for-character from a "PRODUCT slug=..." line in the Context section of the user message. NEVER invent a slug, NEVER guess, NEVER take a slug from History or from your own memory. If a slug is not literally present in the Context, do not emit it.
2. FORBIDDEN LIST: The user message contains an "Already shown — DO NOT emit any of these slugs again" line. NEVER emit any slug from that list. Pick different ones.
3. EVERY TIME you mention any product, you MUST emit its <product slug="..."/> tag on its own line, immediately after the product name.
4. BROWSING INTENT: When the user asks to "see", "show", "view", "any", "what", "browse", "more", "another", "different", "others", or "options" — surface 3 to 5 DISTINCT products from the Context in a single response, each with its own <product slug="..."/> tag. Never reply with only one product when the user is browsing.
5. BRAND DISCIPLINE: If the user asks for Jordans, only emit slugs whose name or slug contains "jordan". For Yeezys, only Yeezy slugs. If the user switches brand, drop the previous brand entirely.
6. EMPTY: If the Context has no matching products, say so plainly. Never substitute.
7. Keep prose short and culture-forward, matching the streetwear voice of the store.

EXAMPLE — browsing intent, multiple products:

User: do you have any Jordan 1s?
You: We've got a few Jordan 1s in stock right now.
<product slug="jordan-1-mid-hyper-royal"/>
<product slug="jordan-1-mid-signal-blue"/>
<product slug="jordan-1-low-dark-beetroot-black-w"/>
Want details on any pair?

EXAMPLE — "more" / "others", skip what was already shown:

History:
assistant: Here's the Jordan 4 Retro Green Glow. <product slug="jordan-4-retro-green-glow"/>
User: more
You: A few more Jordans in the case.
<product slug="jordan-1-mid-hyper-royal"/>
<product slug="jordan-3-retro-laser-orange-w-1"/>
<product slug="jordan-5-retro-se"/>`;

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
    [
      "human",
      "Context (ONLY emit slugs that appear in PRODUCT slug= lines below):\n{context}\n\nAlready shown — DO NOT emit any of these slugs again:\n{forbidden}\n\nHistory:\n{history}\n\nQuestion: {question}",
    ],
  ]);

  function seenFromHistory(history: string): string[] {
    return Array.from(new Set(
      Array.from(history.matchAll(/<product\s+slug="([^"]+)"\s*\/>/g)).map(m => m[1])
    ));
  }

  return RunnableSequence.from([
    {
      question: (i: { question: string; history?: string }) => i.question,
      history: (i: { question: string; history?: string }) => i.history ?? "",
      forbidden: (i: { question: string; history?: string }) => {
        const seen = seenFromHistory(i.history ?? "");
        return seen.length === 0 ? "(none)" : seen.join(", ");
      },
      context: async (i: { question: string; history?: string }) => {
        const history = i.history ?? "";

        // 1. Combine last 2 user turns with the current question so vague
        //    follow-ups ("more", "another") still retrieve in-topic.
        const userTurns = Array.from(history.matchAll(/^user:\s*(.+)$/gim))
          .map(m => m[1].trim())
          .slice(-2);
        const retrievalQuery = [...userTurns, i.question].join(" ");

        // 2. Parse history for slugs already shown so we can exclude them
        //    from retrieval — prevents repeats on "more"/"another".
        const seenSlugs = new Set(seenFromHistory(history));

        // 3. Pull a wide pool, drop already-seen slugs, dedupe by slug, take 10.
        const raw = await store.similaritySearch(retrievalQuery, 30);
        const filtered = raw.filter(d => {
          const slug = (d.metadata as Record<string, unknown>).slug as string | undefined;
          return !slug || !seenSlugs.has(slug);
        });
        return formatContext(dedupeBySlug(filtered, 10));
      },
    },
    prompt,
    llm,
  ]);
}
