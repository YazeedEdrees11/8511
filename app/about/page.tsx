import { loadKB } from "@/lib/catalog";

export default function About() {
  const about = loadKB().find(c => c.id === "about")!;
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">ABOUT</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9] max-w-4xl">
        ADVOCATES OF THE SNEAKER STREETWEAR CULTURE.
      </h1>
      <div className="mt-16 grid md:grid-cols-2 gap-16 max-w-5xl">
        <p className="text-base leading-relaxed">{about.text}</p>
        <div className="font-label text-[11px] tracking-wider2 space-y-4 self-start">
          <div>
            <p className="text-muted">FOUNDED</p>
            <p className="text-ink mt-1 text-base font-body normal-case">2021</p>
          </div>
          <div>
            <p className="text-muted">LOCATION</p>
            <p className="text-ink mt-1 text-base font-body normal-case">Swefieh Village, Amman, Jordan</p>
          </div>
          <div>
            <p className="text-muted">FOCUS</p>
            <p className="text-ink mt-1 text-base font-body normal-case">
              Sneakers · Streetwear · Authentication · Restoration · Custom Art
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
