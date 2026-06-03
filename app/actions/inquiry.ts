"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { sendOwnerEmail } from "@/lib/email";

export type SubmitInquiryInput = {
  userId?: number;
  itemName: string;
  category: string;
  sizeEu?: string;
  budget?: string;
  notes?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
};

export type SubmitInquiryResult = { ok: true; id: number } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitInquiry(input: SubmitInquiryInput): Promise<SubmitInquiryResult> {
  if (!input.itemName.trim())     return { ok: false, error: "itemName required" };
  if (!input.contactName.trim())  return { ok: false, error: "contactName required" };
  if (!EMAIL_RE.test(input.contactEmail.trim())) return { ok: false, error: "valid email required" };

  const row = await prisma.productInquiry.create({
    data: {
      userId: input.userId,
      itemName: input.itemName.trim(),
      category: input.category || "other",
      sizeEu: input.sizeEu,
      budget: input.budget ? new Prisma.Decimal(input.budget) : null,
      notes: input.notes,
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim(),
      contactPhone: input.contactPhone,
    },
  });

  // Email failure must NOT fail the request — the inquiry is already saved.
  try {
    await sendOwnerEmail({
      subject: `New product inquiry: ${row.itemName}`,
      html: `
        <h2>New product inquiry</h2>
        <p><b>Item:</b> ${row.itemName}</p>
        <p><b>Category:</b> ${row.category}</p>
        <p><b>Size (EU):</b> ${row.sizeEu ?? "—"}</p>
        <p><b>Budget:</b> ${row.budget ?? "—"}</p>
        <p><b>Notes:</b> ${row.notes ?? "—"}</p>
        <hr>
        <p><b>Name:</b> ${row.contactName}</p>
        <p><b>Email:</b> ${row.contactEmail}</p>
        <p><b>Phone:</b> ${row.contactPhone ?? "—"}</p>
      `,
    });
  } catch (err) {
    console.error("[inquiry] owner email failed (inquiry still saved):", err);
  }

  return { ok: true, id: row.id };
}
