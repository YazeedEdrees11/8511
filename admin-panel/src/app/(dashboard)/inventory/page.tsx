import { prisma } from "@/lib/db";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  // Query all product variants with their product name, brand, image
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        include: {
          brand: true,
        },
      },
    },
    orderBy: [
      {
        product: {
          name: "asc",
        },
      },
      {
        sizeEu: "asc",
      },
    ],
  });

  return (
    <InventoryClient
      initialVariants={variants.map(v => ({
        id: v.id,
        sizeEu: v.sizeEu,
        sku: v.sku,
        stock: v.stock,
        product: {
          id: v.product.id,
          name: v.product.name,
          imageUrl: v.product.imageUrl,
          brand: {
            name: v.product.brand.name,
          },
        },
      }))}
    />
  );
}
