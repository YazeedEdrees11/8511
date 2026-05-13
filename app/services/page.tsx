import Link from "next/link";
import Image from "next/image";
import { loadKB } from "@/lib/catalog";

const SERVICE_IMAGE: Record<string, string> = {
  "svc-auth": "/images/services/authentication.jpg",
  "svc-consign": "/images/services/consignment.jpg",
  "svc-laundry": "/images/services/laundry.jpg",
  "svc-restoration": "/images/services/restoration.jpg",
  "svc-art": "/images/services/art.jpg",
  "svc-custom": "/images/services/custom.jpg",
  "svc-shipping": "/images/services/shipping.jpg",
  "svc-nikeid": "/images/services/nikeid.jpg",
};

export default function Services() {
  const services = loadKB().filter(c => c.type === "service");
  return (
    <main className="bg-[#F7F7F4] text-[#0A0A0A]">
      {/* Hero Band */}
      <section className="w-full min-h-[480px] flex flex-col md:flex-row border-b border-[#0A0A0A]/10 bg-[#F7F7F4]">
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-16 md:p-16 lg:p-24 border-b md:border-b-0 md:border-r border-[#0A0A0A]/10">
          <h1 className="font-headline text-6xl sm:text-7xl lg:text-8xl xl:text-[8rem] leading-[0.85] tracking-tighter text-[#0A0A0A] uppercase mb-8">
            MORE THAN<br />A SHOP
          </h1>
          <p className="font-body text-base text-[#0A0A0A]/80 max-w-md leading-relaxed">
            We are a sneaker boutique, an authentication desk, a restoration studio, and a custom-art atelier.
            Eight services, one roof, in Swefieh Village, Amman.
          </p>
        </div>
        <div className="w-full md:w-1/2 min-h-[400px] md:min-h-full relative overflow-hidden bg-[#e5e5e5]">
          <Image
            src="/images/services/hero.jpg"
            alt="Craftsman hands working on a sneaker"
            fill
            className="object-cover object-center mix-blend-multiply opacity-90"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </section>

      {/* Services Grid */}
      <section className="w-full max-w-[1600px] mx-auto p-6 md:p-12 lg:p-16 bg-[#F7F7F4]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(s => (
            <div
              key={s.id}
              className="group border border-[#0A0A0A]/20 bg-[#F7F7F4] p-8 min-h-[360px] flex flex-col hover:border-[#FF3B00] transition-colors duration-300"
            >
              <div className="w-full aspect-[4/5] mb-6 overflow-hidden bg-gray-100 relative">
                <Image
                  src={SERVICE_IMAGE[s.id] ?? "/images/services/authentication.jpg"}
                  alt={`${s.title} visual`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-auto">
                <h3 className="font-headline text-2xl uppercase text-[#0A0A0A] leading-tight mb-3">
                  {s.title}
                </h3>
                <p className="font-body text-[13px] text-[#0A0A0A]/70 leading-normal">{s.text}</p>
              </div>
              <span className="material-symbols-outlined text-sm self-end mt-6 text-[#0A0A0A]/30 group-hover:text-[#FF3B00] transition-colors duration-300">
                arrow_forward
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Strip */}
      <section className="w-full bg-[#0A0A0A] flex flex-col items-center justify-center py-20 px-6 text-center min-h-[240px]">
        <h2 className="font-headline text-5xl md:text-6xl text-[#F7F7F4] uppercase tracking-tighter leading-none mb-4">
          NEED SOMETHING SPECIFIC?
        </h2>
        <p className="font-body text-[#F7F7F4]/80 text-sm md:text-base mb-10">
          Talk to the assistant or visit us in store.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/chat"
            className="border border-[#F7F7F4] text-[#F7F7F4] bg-transparent hover:border-[#FF3B00] hover:text-[#FF3B00] transition-colors duration-300 font-label tracking-widest uppercase text-xs px-8 py-4 w-full sm:w-auto text-center"
          >
            ASK 8511
          </Link>
          <a
            href="https://maps.google.com/?cid=15121294295697539889"
            target="_blank"
            rel="noreferrer"
            className="bg-[#FF3B00] text-[#F7F7F4] border border-[#FF3B00] hover:bg-[#FF3B00]/90 transition-colors duration-300 font-label tracking-widest uppercase text-xs px-8 py-4 w-full sm:w-auto text-center"
          >
            VISIT STORE
          </a>
        </div>
      </section>
    </main>
  );
}
