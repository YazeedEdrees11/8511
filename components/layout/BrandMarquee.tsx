function NikeSwoosh({ className = "h-[60px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} fill="currentColor" aria-label="Nike">
      <path d="M9.156 13.184L1.46 16.06c-.66.244-1.226.366-1.682.366-.523 0-.918-.166-1.18-.502-.252-.32-.327-.748-.21-1.222.114-.46.412-.978.876-1.524.36-.42.93-1.013 1.704-1.778l-.04-.026c-.41.244-.78.394-1.04.422-.272.028-.466-.06-.572-.262-.106-.198-.122-.466-.05-.798.072-.34.244-.752.51-1.232.354-.64.928-1.546 1.726-2.726L24 0 9.156 13.184z" />
    </svg>
  );
}

function AdidasTrefoil({ className = "h-[60px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} fill="currentColor" aria-label="Adidas">
      <polygon points="0,60 22,21 50,60" />
      <polygon points="28,60 50,21 78,60" />
      <polygon points="56,60 78,21 100,60" />
    </svg>
  );
}

function SupremeBox({ className = "h-[60px]" }: { className?: string }) {
  return (
    <div className={`bg-[#09090b] px-6 py-2 ${className} flex items-center`}>
      <span className="text-white font-black italic text-4xl tracking-tighter">Supreme</span>
    </div>
  );
}

function HatIcon({ className = "h-[60px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} fill="currentColor" aria-label="Hats">
      <path d="M2 26 C 2 24, 8 18, 24 18 L 40 18 C 56 18, 62 24, 62 26 L 62 30 L 2 30 Z" />
      <path d="M22 18 C 22 8, 30 4, 36 4 C 44 4, 52 10, 52 18 Z" />
    </svg>
  );
}

function LogoSet() {
  return (
    <div className="flex items-center gap-[120px] px-[60px] text-on-surface">
      <NikeSwoosh />
      <AdidasTrefoil />
      <SupremeBox />
      <HatIcon />
    </div>
  );
}

export default function BrandMarquee() {
  return (
    <div className="animate-marquee flex items-center">
      <LogoSet />
      <LogoSet />
      <LogoSet />
      <LogoSet />
    </div>
  );
}
