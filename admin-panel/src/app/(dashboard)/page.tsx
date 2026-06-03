import { prisma } from "@/lib/db";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // Query all products with their brands and variants
  const products = await prisma.product.findMany({
    include: {
      brand: true,
      variants: {
        orderBy: {
          sizeEu: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Query all brands
  const brands = await prisma.brand.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <ProductsClient
      initialProducts={products.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: {
          id: p.brand.id,
          name: p.brand.name,
          slug: p.brand.slug,
        },
        basePrice: p.basePrice,
        imageUrl: p.imageUrl,
        variants: p.variants.map(v => ({
          id: v.id,
          sizeEu: v.sizeEu,
          stock: v.stock,
        })),
      }))}
      brands={brands}
    />
  );
}
