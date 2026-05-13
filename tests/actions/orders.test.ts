import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { placeOrder } from "@/app/actions/orders";

describe("placeOrder", () => {
  let userId: number, addressId: number, productId: number, variantId: number;

  beforeAll(async () => {
    const u = await prisma.user.findFirstOrThrow({ include: { addresses: true } });
    userId = u.id;
    addressId = u.addresses[0].id;
    const p = await prisma.product.findFirstOrThrow({ include: { variants: true } });
    productId = p.id;
    variantId = p.variants[0].id;
  });

  afterAll(() => prisma.$disconnect());

  it("creates an order with snapshot prices and an item", async () => {
    const result = await placeOrder({
      userId,
      addressId,
      items: [{ productId, variantId, quantity: 1 }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: result.orderId },
      include: { items: true },
    });
    expect(order.items).toHaveLength(1);
    expect(Number(order.total)).toBeGreaterThan(0);
  });

  it("rejects empty item list", async () => {
    const result = await placeOrder({ userId, addressId, items: [] });
    expect(result.ok).toBe(false);
  });
});
