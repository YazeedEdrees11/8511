import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({
    include: { brand: true },
    orderBy: { createdAt: "desc" }
  });
  console.log(JSON.stringify(products.map(p => ({
    name: p.name,
    slug: p.slug,
    brand: p.brand.name,
    imageUrl: p.imageUrl,
  })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
