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
          <div key={i} className="text-ink">
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
