import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

const { getCurrentUserWithVerification } = vi.hoisted(() => ({
  getCurrentUserWithVerification: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserWithVerification }));
vi.mock("@/lib/email", () => ({ sendOwnerEmail: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

import { prisma } from "@/lib/db";
import { checkout } from "@/app/actions/orders";

const address = { line1: "1 Test St", city: "Amman", country: "Jordan" };

describe("checkout", () => {
  let productId: number, variantId: number, userId: number;

  beforeAll(async () => {
    const u = await prisma.user.findFirstOrThrow();
    userId = u.id;
    const p = await prisma.product.findFirstOrThrow({ include: { variants: true } });
    productId = p.id;
    variantId = p.variants[0].id;
    getCurrentUserWithVerification.mockResolvedValue({ user: u, emailVerified: true });
  });

  afterAll(() => prisma.$disconnect());

  it("creates an address and an order for a verified user", async () => {
    const result = await checkout({ address, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId }, include: { address: true } });
    expect(order.address.line1).toBe("1 Test St");
    expect(order.address.userId).toBe(userId);
  });

  it("rejects an unverified user", async () => {
    const u = await prisma.user.findFirstOrThrow();
    getCurrentUserWithVerification.mockResolvedValueOnce({ user: u, emailVerified: false });
    const result = await checkout({ address, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toMatch(/verify your email/i);
  });

  it("rejects when not logged in", async () => {
    getCurrentUserWithVerification.mockResolvedValueOnce(null);
    const result = await checkout({ address, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("auth required");
  });
});
