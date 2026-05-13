import ChatPanel from "@/components/chat/ChatPanel";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <main className="flex-grow">
      {/* Hero */}
      <section className="h-[240px] flex flex-col justify-center px-6 md:px-12 bg-[#F7F7F4]">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="font-headline text-6xl md:text-8xl tracking-tight leading-none mb-4">
            ASK 8511
          </h1>
          <p className="font-body text-base max-w-[60ch] text-[#0A0A0A]/80">
            Ask about products, services, sizing, store hours, or sneaker history.
          </p>
        </div>
      </section>

      {/* Main Layout — single column, full width inside max-w-7xl */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="border border-[#0A0A0A]/15 bg-[#F7F7F4] rounded-[4px] flex flex-col relative overflow-hidden">
            <ChatPanel initialQuestion={q} />
          </div>
        </div>
      </section>
    </main>
  );
}
