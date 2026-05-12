import { loadProducts } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET() {
  const products = await loadProducts();
  const payload = products.map(p => ({
    slug: p.slug,
    name: p.name,
    brand: p.brand.slug,
    price: p.basePrice ? `${p.basePrice.toString()} JOD` : undefined,
    image_url: p.imageUrl,
    source_url: p.sourceUrl,
    description: p.description,
  }));
  return Response.json(payload);
}
