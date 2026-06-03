import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductForm from "@/app/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      brand: true,
      variants: {
        orderBy: {
          sizeEu: "asc",
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const brands = await prisma.brand.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const initialData = {
    name: product.name,
    slug: product.slug,
    brandName: product.brand.name,
    description: product.description,
    imageUrl: product.imageUrl,
    basePrice: product.basePrice ? Number(product.basePrice) : 0,
    variants: product.variants.map(v => ({
      sizeEu: v.sizeEu,
      stock: v.stock,
    })),
  };

  return (
    <div className="flex-grow bg-[#F7F7F4] flex justify-center py-10">
      <ProductForm
        productId={product.id}
        initialData={initialData}
        brands={brands.map(b => ({ name: b.name, slug: b.slug }))}
      />
    </div>
  );
}
