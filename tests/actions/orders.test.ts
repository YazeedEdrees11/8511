import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser }));
vi.mock("@/lib/email", () => ({ sendOwnerEmail: vi.fn() }));

import { prisma } from "@/lib/db";
import { placeOrder } from "@/app/actions/orders";

describe("placeOrder", () => {
  let addressId: number, productId: number, variantId: number;

  beforeAll(async () => {
    const u = await prisma.user.findFirstOrThrow({ include: { addresses: true } });
    addressId = u.addresses[0].id;
    const p = await prisma.product.findFirstOrThrow({ include: { variants: true } });
    productId = p.id;
    variantId = p.variants[0].id;
    // logged-in by default: getCurrentUser resolves to the real user
    getCurrentUser.mockResolvedValue(u);
  });

  afterAll(() => prisma.$disconnect());

  it("creates an order with snapshot prices and an item", async () => {
    const result = await placeOrder({ addressId, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId }, include: { items: true } });
    expect(order.items).toHaveLength(1);
    expect(Number(order.total)).toBeGreaterThan(0);
  });

  it("rejects empty item list", async () => {
    const result = await placeOrder({ addressId, items: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects when not logged in", async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    const result = await placeOrder({ addressId, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("auth required");
  });
});
