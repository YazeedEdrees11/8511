import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { submitConsignment } from "@/app/actions/consignment";

describe("submitConsignment", () => {
  afterAll(() => prisma.$disconnect());

  it("creates a submission with status 'submitted'", async () => {
    const r = await submitConsignment({
      productName: "Test Pair",
      brand: "nike",
      sizeEu: "42",
      askingPrice: "100.00",
      imageUrls: ["https://example.com/a.jpg"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    const sub = await prisma.consignmentSubmission.findUniqueOrThrow({ where: { id: r.id } });
    expect(sub.status).toBe("submitted");
    expect(JSON.parse(sub.imageUrls)).toEqual(["https://example.com/a.jpg"]);
    await prisma.consignmentSubmission.delete({ where: { id: r.id } });
  });

  it("rejects missing required fields", async () => {
    const r = await submitConsignment({ productName: "", brand: "nike", imageUrls: [] });
    expect(r.ok).toBe(false);
  });
});
