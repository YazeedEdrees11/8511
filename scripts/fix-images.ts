import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const IMAGE_UPDATES = [
  {
    slug: "carhartt-watch-beanie-black",
    imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "stussy-stock-low-pro-cap",
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "new-era-yankees-black-cap",
    imageUrl: "https://images.unsplash.com/photo-1534215754734-18e55d13ce35?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "supreme-box-logo-tee-white",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "supreme-box-logo-tee-black",
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "supreme-bogo-hoodie-grey",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "supreme-bogo-hoodie-navy",
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "supreme-mountain-jacket",
    imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "supreme-arc-logo-crewneck",
    imageUrl: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "dunk-low-panda",
    imageUrl: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "jordan-4-retro-bred",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "air-force-1-low-triple-white",
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "jordan-1-mid-hyper-royal",
    imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "yeezy-boost-350-v2-zebra",
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=600&auto=format&fit=crop"
  },
  {
    slug: "samba-og-cloud-white",
    imageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=600&auto=format&fit=crop"
  }
];

async function main() {
  console.log("Updating product images in database...");
  for (const update of IMAGE_UPDATES) {
    const res = await prisma.product.updateMany({
      where: { slug: update.slug },
      data: { imageUrl: update.imageUrl }
    });
    console.log(`Updated ${update.slug}: ${res.count} record(s)`);
  }
  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
