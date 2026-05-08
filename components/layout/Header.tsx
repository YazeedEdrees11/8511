import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/chat", label: "Ask 8511" },
];

export default function Header() {
  return (
    <header className="border-b border-line/20 bg-paper sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-20">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Eighty Five Eleven" width={160} height={48} priority />
        </Link>
        <nav className="hidden md:flex gap-8 text-sm tracking-wider2 uppercase">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="hover:text-accent transition-colors">{n.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
