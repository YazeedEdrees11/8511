import { InferenceClient } from "@huggingface/inference";
import { RunnableLambda } from "@langchain/core/runnables";
import type { ChatPromptValue } from "@langchain/core/prompt_values";

export function makeQwen(opts?: { model?: string; temperature?: number; maxTokens?: number }) {
  const apiKey = process.env.HF_TOKEN;
  if (!apiKey) throw new Error("HF_TOKEN missing");
  const client = new InferenceClient(apiKey);
  const model = opts?.model ?? "Qwen/Qwen2.5-7B-Instruct";
  const temperature = opts?.temperature ?? 0.05;
  const max_tokens = opts?.maxTokens ?? 600;

  return RunnableLambda.from(async function* (input: ChatPromptValue) {
    const messages = input.messages.map((m) => {
      const t = m._getType();
      const role = t === "system" ? "system" : t === "ai" ? "assistant" : "user";
      return { role, content: m.content as string };
    });
    const stream = client.chatCompletionStream({ model, messages, temperature, max_tokens });
    for await (const chunk of stream) {
      const c = chunk.choices?.[0]?.delta?.content;
      if (c) yield c;
    }
  });
}
