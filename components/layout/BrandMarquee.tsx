"use client";

/**
 * Premium brand ticker — uses bold typographic wordmarks
 * separated by thin vertical lines. Renders on a dark strip
 * so all text is white/light.
 */

const BRANDS = [
  { name: "NIKE", style: "font-black text-[26px] tracking-[0.08em] italic" },
  { name: "ADIDAS", style: "font-black text-[22px] tracking-[0.22em]" },
  { name: "JORDAN", style: "font-black text-[22px] tracking-[0.18em]" },
  { name: "SUPREME", style: "font-black text-[22px] tracking-[0.14em] italic" },
  { name: "NEW ERA", style: "font-black text-[20px] tracking-[0.20em]" },
  { name: "VON DUTCH", style: "font-black text-[20px] tracking-[0.12em] italic" },
  { name: "ADEEN", style: "font-black text-[20px] tracking-[0.24em]" },
];

/* Thin vertical separator */
function Sep() {
  return <span className="w-px h-5 bg-white/20 flex-shrink-0" />;
}

/* One full set of all brands */
function LogoSet() {
  return (
    <div className="flex items-center gap-10 px-5">
      {BRANDS.map((b) => (
        <div key={b.name} className="flex items-center gap-10">
          <span
            className={`leading-none whitespace-nowrap select-none ${b.style}`}
            style={{ fontFamily: '"Bebas Neue", "Inter", system-ui, sans-serif' }}
          >
            {b.name}
          </span>
          <Sep />
        </div>
      ))}
    </div>
  );
}

export default function BrandMarquee() {
  return (
    <div
      className="flex items-center text-white/90"
      style={{
        width: "max-content",
        animation: "marquee 35s linear infinite",
      }}
    >
      <LogoSet />
      <LogoSet />
      <LogoSet />
      <LogoSet />
    </div>
  );
}
