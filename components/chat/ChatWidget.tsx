"use client";
import { useState } from "react";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 bg-accent text-paper rounded-full px-5 py-3 shadow-lg z-40 text-sm tracking-wider2 uppercase">
        {open ? "Close" : "Ask 8511"}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-[380px] max-w-[90vw] bg-paper border border-line/30 shadow-2xl rounded-md overflow-hidden z-40">
          <ChatPanel compact />
        </div>
      )}
    </>
  );
}
