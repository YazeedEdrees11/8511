"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ProductCard from "./ProductCard";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTED = [
  "WHAT YEEZYS DO YOU HAVE?",
  "TELL ME ABOUT CONSIGNMENT",
  "STORE HOURS?",
  "DO YOU SHIP TO RIYADH?",
];

function SneakerIcon({ thinking }: { thinking: boolean }) {
  return (
    <Image
      src="/sneaker-icon.png"
      alt=""
      width={56}
      height={56}
      className={`w-14 h-14 object-contain mix-blend-multiply ${thinking ? "animate-sneaker-spin" : "animate-sneaker-pulse"}`}
    />
  );
}

function renderAssistant(text: string) {
  const parts = text.split(/(<product\s+slug="[^"]+"\s*\/>)/g);
  const cards: { slug: string }[] = [];
  const textParts: string[] = [];
  for (const part of parts) {
    const m = part.match(/<product\s+slug="([^"]+)"\s*\/>/);
    if (m) cards.push({ slug: m[1] });
    else if (part) textParts.push(part);
  }
  return (
    <>
      <div className="font-body text-[15px] max-w-[80%] mb-4 whitespace-pre-wrap">{textParts.join("")}</div>
      {cards.length > 0 && (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <ProductCard key={i} slug={c.slug} />
          ))}
        </div>
      )}
    </>
  );
}

export default function ChatPanel({
  compact = false,
  initialQuestion,
}: {
  compact?: boolean;
  initialQuestion?: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const initialFiredRef = useRef(false);

  async function send(forced?: string) {
    const q = (forced ?? input).trim();
    if (!q || busy) return;
    if (!forced) setInput("");
    const prior = msgs;
    setMsgs(m => [...m, { role: "user", text: q }, { role: "assistant", text: "" }]);
    setBusy(true);
    try {
      const history = prior.map(m => `${m.role}: ${m.text}`).join("\n");
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
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialQuestion && !initialFiredRef.current) {
      initialFiredRef.current = true;
      send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const lastIdx = msgs.length - 1;

  return (
    <>
      {/* LIVE tag */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 font-label text-[10px] tracking-widest uppercase bg-[#F7F7F4] border border-[#0A0A0A]/10 px-2 py-1 rounded-[2px]">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> LIVE
      </div>

      {/* Convo */}
      <div className={`flex-grow overflow-y-auto p-8 pt-16 flex flex-col gap-8 ${compact ? "max-h-[420px]" : ""}`}>
        {msgs.length === 0 && (
          <p className="text-[#0A0A0A]/60 text-sm">
            Ask about a sneaker, a service, or the store.
          </p>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex flex-col gap-1 items-end">
              <span className="font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60">YOU</span>
              <div className="font-body text-[15px] max-w-[80%] text-right">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="flex flex-col gap-1 items-start">
              <span className="flex items-center">
                <SneakerIcon thinking={busy && i === lastIdx} />
              </span>
              {/* If still streaming and no text yet, show loading dot row */}
              {busy && i === lastIdx && !m.text ? (
                <div className="font-body text-[15px] text-[#0A0A0A]/40 mt-2">Thinking…</div>
              ) : (
                renderAssistant(m.text)
              )}
            </div>
          )
        )}
        <div ref={endRef} />

        {/* Suggested chips */}
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-[#0A0A0A]/10">
            {SUGGESTED.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={busy}
                className="font-label text-[10px] tracking-widest uppercase border border-[#0A0A0A]/20 px-3 py-1.5 rounded-[2px] hover:border-[#0A0A0A] hover:text-primary transition-colors bg-white disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={e => {
          e.preventDefault();
          send();
        }}
        className="border-t border-[#0A0A0A]/15 bg-white p-4"
      >
        <div className="flex items-center gap-4 mb-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask 8511..."
            className="flex-grow bg-transparent border-none outline-none focus:ring-0 font-body text-base placeholder:text-[#0A0A0A]/40"
          />
          <button
            disabled={busy || !input.trim()}
            className="bg-[#0A0A0A] text-[#F7F7F4] font-label text-xs tracking-wider uppercase px-6 py-3 rounded-[4px] hover:bg-primary hover:text-[#0A0A0A] transition-colors flex items-center gap-2 disabled:opacity-40"
          >
            SEND <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
          </button>
        </div>
        <p className="font-body text-[10px] text-[#0A0A0A]/40 text-center uppercase tracking-wider">
          Answers are grounded in the 8511 catalog. Verify in-store for stock.
        </p>
      </form>
    </>
  );
}
