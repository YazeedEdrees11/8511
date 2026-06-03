import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full px-6 md:px-10 py-20 flex flex-col md:flex-row justify-between gap-12 bg-surface text-on-surface border-t border-on-surface/10">
      <div className="flex flex-col gap-6 w-full md:w-1/3">
        <h2 className="font-headline text-4xl uppercase tracking-tighter font-black text-on-surface">
          8511
        </h2>
        <p className="font-body text-sm tracking-normal text-on-surface/60">
          © {new Date().getFullYear()} 8511 AMMAN. ALL RIGHTS RESERVED.
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full md:w-1/3">
        <a
          href="https://www.instagram.com/eightyfiveeleven"
          target="_blank"
          rel="noreferrer"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          INSTAGRAM
        </a>
        <Link
          href="/services"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          SERVICES
        </Link>
        <Link
          href="/about"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          ABOUT
        </Link>
        <Link
          href="/contact"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          CONTACT
        </Link>
        <Link
          href="/chat"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          ASK 8511
        </Link>
        <Link
          href="/admin"
          className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/40 hover:text-primary hover:underline decoration-1 underline-offset-4 transition-all"
        >
          ADMIN PANEL
        </Link>
      </div>
      <div className="flex flex-col gap-4 w-full md:w-1/3">
        <p className="font-label uppercase tracking-[0.2em] text-xs text-on-surface/60">INQUIRIES</p>
        <a
          href="mailto:EightyFiveEleven.8511@gmail.com"
          className="font-body text-sm text-on-surface hover:text-primary transition-colors break-all"
        >
          EightyFiveEleven.8511@gmail.com
        </a>
        <a
          href="https://www.instagram.com/eightyfiveeleven"
          target="_blank"
          rel="noreferrer"
          className="font-body text-sm text-on-surface hover:text-primary transition-colors"
        >
          @eightyfiveeleven
        </a>
      </div>
    </footer>
  );
}
