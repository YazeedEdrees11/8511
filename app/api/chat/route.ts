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
