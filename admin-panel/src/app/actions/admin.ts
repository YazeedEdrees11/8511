"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@8511.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin8511";

export async function adminLogin(email: string, password: string) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });
    return { success: true };
  }
  return { success: false, error: "Invalid admin email or password." };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return { success: true };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session === "authenticated";
}

interface ProductInput {
  name: string;
  slug: string;
  brandName: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  variants: {
    sizeEu: string;
    stock: number;
  }[];
}

export async function addProduct(data: ProductInput) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const brandSlug = data.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  
  // Find or create brand
  let brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        slug: brandSlug,
        name: data.brandName,
      },
    });
  }

  // Create product
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      brandId: brand.id,
      description: data.description,
      imageUrl: data.imageUrl || "/images/products/placeholder.jpg",
      sourceUrl: `https://www.eightyfiveeleven.com/product-page/${data.slug}`,
      basePrice: new Prisma.Decimal(data.basePrice),
    },
  });

  // Create variants
  for (const v of data.variants) {
    const sku = `${data.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${v.sizeEu}`;
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sizeEu: v.sizeEu,
        sku,
        stock: v.stock,
        price: new Prisma.Decimal(data.basePrice),
      },
    });
  }

  revalidatePath("/");
  return { success: true, productId: product.id };
}

export async function updateProduct(id: number, data: ProductInput) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const brandSlug = data.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  
  // Find or create brand
  let brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        slug: brandSlug,
        name: data.brandName,
      },
    });
  }

  // Update product
  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      brandId: brand.id,
      description: data.description,
      imageUrl: data.imageUrl,
      basePrice: new Prisma.Decimal(data.basePrice),
    },
  });

  // Handle variants
  // Delete variants that are no longer present
  const currentVariants = await prisma.productVariant.findMany({
    where: { productId: id },
  });

  const incomingSizes = data.variants.map(v => v.sizeEu);
  const toDelete = currentVariants.filter(cv => !incomingSizes.includes(cv.sizeEu));

  for (const cv of toDelete) {
    await prisma.productVariant.delete({
      where: { id: cv.id },
    });
  }

  // Upsert variants
  for (const v of data.variants) {
    const sku = `${data.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${v.sizeEu}`;
    await prisma.productVariant.upsert({
      where: {
        productId_sizeEu: {
          productId: id,
          sizeEu: v.sizeEu,
        },
      },
      create: {
        productId: id,
        sizeEu: v.sizeEu,
        sku,
        stock: v.stock,
        price: new Prisma.Decimal(data.basePrice),
      },
      update: {
        stock: v.stock,
        price: new Prisma.Decimal(data.basePrice),
      },
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(id: number) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  // Fetch product to find its slug for revalidation
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return { success: false, error: "Product not found." };
  }

  // Delete product (cascade deletes images and variants automatically due to onDelete: Cascade in schema)
  await prisma.product.delete({
    where: { id },
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateVariantStock(variantId: number, stock: number) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: Math.max(0, stock) },
  });

  revalidatePath("/");
  return { success: true, newStock: variant.stock };
}
