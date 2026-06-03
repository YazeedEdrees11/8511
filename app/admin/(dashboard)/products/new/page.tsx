import { prisma } from "@/lib/db";
import ProductForm from "@/app/admin/products/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const brands = await prisma.brand.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex-grow bg-[#F7F7F4] flex justify-center py-10">
      <ProductForm brands={brands.map(b => ({ name: b.name, slug: b.slug }))} />
    </div>
  );
}
