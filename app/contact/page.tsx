import { loadKB } from "@/lib/catalog";
export default function Contact() {
  const c = loadKB().find(x => x.id === "contact")!;
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-display text-4xl">Contact</h1>
      <p className="mt-6 leading-relaxed whitespace-pre-line">{c.text}</p>
      <a href="https://maps.google.com/?cid=15121294295697539889" target="_blank"
         className="inline-block mt-8 px-6 py-3 bg-ink text-paper text-sm uppercase tracking-wider2">Open in Google Maps</a>
    </div>
  );
}
