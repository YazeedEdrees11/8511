import { loadKB } from "@/lib/catalog";
export default function Services() {
  const services = loadKB().filter(c => c.type === "service");
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl mb-8">What we do</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {services.map((s, i) => (
          <div key={s.id} className="border border-line/20 p-6">
            <div className="text-muted text-xs tracking-wider2">{String(i + 1).padStart(2, "0")}</div>
            <div className="font-display text-2xl mt-2">{s.title}</div>
            <p className="mt-3 text-sm text-muted">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
