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
          <p className="font-label text-xs tracking-widest text-[#0A0A0A]/60 mb-2 uppercase">
            8511 ASSISTANT — POWERED BY GEMINI + QWEN
          </p>
          <h1 className="font-headline text-6xl md:text-8xl tracking-tight leading-none mb-4">
            ASK 8511.
          </h1>
          <p className="font-body text-base max-w-[60ch] text-[#0A0A0A]/80">
            Ask about products, services, sizing, store hours, or sneaker history. Trained on the 8511 catalog.
          </p>
        </div>
      </section>

      {/* Main Layout: chat surface (2/3) + side panel (1/3) */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 border border-[#0A0A0A]/15 bg-[#F7F7F4] rounded-[4px] h-[720px] flex flex-col relative overflow-hidden">
            <ChatPanel initialQuestion={q} />
          </div>
          <aside className="hidden lg:flex flex-col gap-12">
            <div>
              <h2 className="font-headline text-3xl mb-6 tracking-tight">STORE INFO</h2>
              <div className="mb-8">
                <h3 className="font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60 mb-2">
                  VISIT US
                </h3>
                <p className="font-body text-sm leading-relaxed">
                  Swefieh Village<br />Amman, Jordan
                </p>
              </div>
              <div className="mb-8">
                <h3 className="font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60 mb-2">
                  HOURS
                </h3>
                <p className="font-body text-sm leading-relaxed">
                  Sat–Thu: 12PM – 10PM<br />Fri: closed
                </p>
              </div>
              <div className="mb-8">
                <h3 className="font-label text-[10px] tracking-widest uppercase text-[#0A0A0A]/60 mb-2">
                  CONTACT
                </h3>
                <p className="font-body text-sm leading-relaxed">
                  IG: @eightyfiveeleven<br />
                  <a href="mailto:EightyFiveEleven.8511@gmail.com" className="hover:text-[#FF3B00] break-all">
                    EightyFiveEleven.8511@gmail.com
                  </a>
                </p>
              </div>
            </div>
            <div className="mt-auto border-t border-[#0A0A0A]/15 pt-8">
              <p className="font-display italic text-lg leading-tight tracking-tight text-[#0A0A0A]/80">
                &ldquo;Advocates of the sneaker streetwear culture.&rdquo;
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
