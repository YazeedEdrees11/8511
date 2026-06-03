import { prisma } from "@/lib/db";
import ProductForm from "@/app/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  // Fetch existing brands for autofill / dropdown
  const brands = await prisma.brand.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <ProductForm
      brands={brands.map(b => ({
        name: b.name,
        slug: b.slug,
      }))}
    />
  );
}
