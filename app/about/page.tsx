import { loadKB } from "@/lib/catalog";
export default function About() {
  const about = loadKB().find(c => c.id === "about")!;
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-display text-4xl">About</h1>
      <p className="mt-6 leading-relaxed">{about.text}</p>
    </div>
  );
}
