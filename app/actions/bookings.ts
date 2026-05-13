"use server";

import { prisma } from "@/lib/db";

export type BookServiceInput = {
  userId?: number;
  serviceKey: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
};

export type BookServiceResult = { ok: true; id: number } | { ok: false; error: string };

export async function bookService(input: BookServiceInput): Promise<BookServiceResult> {
  if (!input.contactEmail.trim()) return { ok: false, error: "contactEmail required" };
  if (!input.contactName.trim())  return { ok: false, error: "contactName required" };
  if (!input.serviceKey.trim())   return { ok: false, error: "serviceKey required" };

  const row = await prisma.serviceBooking.create({
    data: {
      userId: input.userId,
      serviceKey: input.serviceKey,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      notes: input.notes,
    },
  });
  return { ok: true, id: row.id };
}
