export default function Contact() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">CONTACT</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">
        COME SAY HELLO.
      </h1>
      <div className="mt-16 grid md:grid-cols-3 gap-10 max-w-5xl font-label text-[11px] tracking-wider2">
        <div>
          <p className="text-muted">VISIT</p>
          <p className="mt-2 text-ink text-base font-body normal-case">
            Swefieh Village<br />Amman, Jordan
          </p>
          <a
            href="https://maps.google.com/?cid=15121294295697539889"
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-4 hover:text-accent"
          >
            OPEN IN GOOGLE MAPS →
          </a>
        </div>
        <div>
          <p className="text-muted">EMAIL</p>
          <a
            href="mailto:EightyFiveEleven.8511@gmail.com"
            className="block mt-2 text-ink text-base font-body normal-case hover:text-accent"
          >
            EightyFiveEleven.8511@gmail.com
          </a>
        </div>
        <div>
          <p className="text-muted">SOCIAL</p>
          <a
            href="https://www.instagram.com/eightyfiveeleven"
            target="_blank"
            rel="noreferrer"
            className="block mt-2 text-ink text-base font-body normal-case hover:text-accent"
          >
            @eightyfiveeleven
          </a>
        </div>
      </div>

      <div className="mt-20 border-t border-ink/15 pt-10 max-w-3xl">
        <p className="font-label text-[11px] tracking-wider2 text-muted">QUESTIONS?</p>
        <p className="mt-3 text-base text-ink/80 leading-relaxed">
          Ask the in-store assistant anytime — sizing, stock, services, or sneaker history.
          Trained on the entire 8511 catalog.
        </p>
        <a
          href="/chat"
          className="inline-block mt-6 bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors"
        >
          ASK 8511 →
        </a>
      </div>
    </div>
  );
}
