import { loadProducts } from "@/lib/catalog";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const rawProducts = await loadProducts();

  // Map products to ensure they are fully serializable in Next.js (Decimal to Number)
  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: p.basePrice ? Number(p.basePrice) : 0,
    imageUrl: p.imageUrl,
    brand: {
      name: p.brand.name,
      slug: p.brand.slug,
    },
    variants: p.variants.map((v) => ({
      id: v.id,
      sizeEu: v.sizeEu,
      stock: v.stock,
    })),
  }));

  return (
    <main className="min-h-screen bg-white">
      <ShopClient initialProducts={products} />
    </main>
  );
}
