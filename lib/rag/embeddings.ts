import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
import { GoogleGenAI } from "@google/genai";

type Opts = EmbeddingsParams & {
  apiKey?: string;
  model?: string;
  /** Inject a client for testing. Production uses GoogleGenAI({ apiKey }). */
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

  private async embedOne(part: { text?: string; inlineData?: { mimeType: string; data: string } }): Promise<number[]> {
    const r = await this.client.models.embedContent({
      model: this.model,
      contents: [{ parts: [part] }],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseObj: any = r;
    const values = responseObj.embeddings?.[0]?.values;
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
