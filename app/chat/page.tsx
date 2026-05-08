import ChatPanel from "@/components/chat/ChatPanel";
export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl mb-4">Ask 8511</h1>
      <div className="border border-line/20 rounded-md overflow-hidden"><ChatPanel /></div>
    </div>
  );
}
