"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type SubmitConsignmentInput = {
  userId?: number;
  productName: string;
  brand: string;
  sizeEu?: string;
  conditionNote?: string;
  askingPrice?: string;
  imageUrls: string[];
};

export type SubmitConsignmentResult = { ok: true; id: number } | { ok: false; error: string };

export async function submitConsignment(input: SubmitConsignmentInput): Promise<SubmitConsignmentResult> {
  if (!input.productName.trim()) return { ok: false, error: "productName required" };
  if (!input.brand.trim())       return { ok: false, error: "brand required" };

  const row = await prisma.consignmentSubmission.create({
    data: {
      userId: input.userId,
      productName: input.productName,
      brand: input.brand,
      sizeEu: input.sizeEu,
      conditionNote: input.conditionNote,
      askingPrice: input.askingPrice ? new Prisma.Decimal(input.askingPrice) : null,
      imageUrls: JSON.stringify(input.imageUrls ?? []),
    },
  });
  return { ok: true, id: row.id };
}
