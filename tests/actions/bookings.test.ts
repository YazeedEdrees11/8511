import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { bookService } from "@/app/actions/bookings";

describe("bookService", () => {
  afterAll(() => prisma.$disconnect());

  it("creates a booking with status 'new'", async () => {
    const r = await bookService({
      serviceKey: "svc-laundry",
      contactName: "Test User",
      contactEmail: "test@example.com",
      notes: "Two pairs.",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    const b = await prisma.serviceBooking.findUniqueOrThrow({ where: { id: r.id } });
    expect(b.status).toBe("new");
    await prisma.serviceBooking.delete({ where: { id: r.id } });
  });

  it("rejects missing email", async () => {
    const r = await bookService({
      serviceKey: "svc-laundry",
      contactName: "Test",
      contactEmail: "",
    });
    expect(r.ok).toBe(false);
  });
});
