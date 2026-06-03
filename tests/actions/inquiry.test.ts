import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { submitInquiry } from "@/app/actions/inquiry";

describe("submitInquiry", () => {
  afterAll(() => prisma.$disconnect());

  it("creates an inquiry with status 'new'", async () => {
    const r = await submitInquiry({
      itemName: "Travis Scott AJ1 Mocha",
      category: "shoe",
      sizeEu: "42",
      budget: "300.00",
      notes: "DS only",
      contactName: "Omar",
      contactEmail: "buyer@example.com",
      contactPhone: "0790000000",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    const row = await prisma.productInquiry.findUniqueOrThrow({ where: { id: r.id } });
    expect(row.status).toBe("new");
    expect(row.itemName).toBe("Travis Scott AJ1 Mocha");
    await prisma.productInquiry.delete({ where: { id: r.id } });
  });

  it("rejects missing required fields", async () => {
    const r = await submitInquiry({
      itemName: "", category: "shoe", contactName: "Omar", contactEmail: "buyer@example.com",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects a malformed email", async () => {
    const r = await submitInquiry({
      itemName: "Some Hoodie", category: "other", contactName: "Omar", contactEmail: "not-an-email",
    });
    expect(r.ok).toBe(false);
  });
});
