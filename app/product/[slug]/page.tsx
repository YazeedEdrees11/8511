import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, loadProducts } from "@/lib/catalog";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";

const BRAND_LABEL: Record<string, string> = {
  nike: "NIKE",
  adidas: "ADIDAS",
  supreme: "SUPREME",
  hats: "HATS",
};

function serializeProduct(product: any) {
  if (!product) return null;
  return {
    ...product,
    basePrice: product.basePrice ? Number(product.basePrice) : null,
    variants: product.variants?.map((v: any) => ({
      ...v,
      price: v.price ? Number(v.price) : null,
    })) || [],
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : String(product.createdAt),
    releaseDate: product.releaseDate instanceof Date ? product.releaseDate.toISOString() : String(product.releaseDate),
  };
}

export default async function PDP({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawProduct = await getProductBySlug(slug);
  if (!rawProduct) notFound();
  
  const p = serializeProduct(rawProduct);
  const brandLabel = BRAND_LABEL[rawProduct.brand.slug] || rawProduct.brand.name;
  
  const all = await loadProducts();
  const rawRelated = all.filter(q => q.brand.slug === rawProduct.brand.slug && q.slug !== rawProduct.slug).slice(0, 4);
  const related = rawRelated.map(serializeProduct);

  return (
    <main className="max-w-[1440px] mx-auto pb-24 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <div className="py-6 font-label text-[10px] uppercase tracking-[0.2em] text-[#888888] flex items-center gap-1.5 font-bold">
        <Link href="/" className="hover:text-black transition-colors">HOME</Link>
        <span className="text-[#CCCCCC] text-[12px] font-normal">/</span>
        <Link href="/shop" className="hover:text-black transition-colors">SHOP</Link>
        <span className="text-[#CCCCCC] text-[12px] font-normal">/</span>
        <span className="text-black">{p?.name.toUpperCase()}</span>
      </div>

      {/* Main product card client display */}
      <ProductDetailClient product={p as any} related={related as any} />
    </main>
  );
}
