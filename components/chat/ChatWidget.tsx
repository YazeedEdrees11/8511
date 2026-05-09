"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Hide widget on the dedicated /chat page (we ARE the chat there).
  if (pathname?.startsWith("/chat")) return null;
  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 bg-accent text-paper rounded-full px-6 py-3.5 shadow-xl z-40 font-label text-[11px] tracking-wider2 hover:bg-ink transition-colors flex items-center gap-2"
      >
        {open ? (
          <>CLOSE ✕</>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse" />
            ASK 8511
          </>
        )}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-[400px] max-w-[92vw] bg-paper border border-ink/20 shadow-2xl overflow-hidden z-40">
          <ChatPanel compact />
        </div>
      )}
    </>
  );
}
