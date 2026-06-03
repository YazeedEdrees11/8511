"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { sendOwnerEmail } from "@/lib/email";

export type PlaceOrderInput = {
  addressId: number;
  items: { productId: number; variantId?: number; quantity: number }[];
};

export type PlaceOrderResult =
  | { ok: true; orderId: number; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth required" };
  if (!input.items.length) return { ok: false, error: "no items" };

  const result = await prisma.$transaction(async (tx) => {
    const productIds = input.items.map(i => i.productId);
    const variantIds = input.items.map(i => i.variantId).filter((v): v is number => typeof v === "number");
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const variants = await tx.productVariant.findMany({ where: { id: { in: variantIds } } });

    let subtotal = new Prisma.Decimal(0);
    const itemRows: Prisma.OrderItemCreateManyOrderInput[] = [];

    for (const i of input.items) {
      const product = products.find(p => p.id === i.productId);
      if (!product) return { ok: false as const, error: `product ${i.productId} missing` };
      const variant = i.variantId ? variants.find(v => v.id === i.variantId) : undefined;
      const unitPrice = variant?.price ?? product.basePrice ?? new Prisma.Decimal("0");
      subtotal = subtotal.add(unitPrice.mul(i.quantity));
      itemRows.push({
        productId: product.id,
        variantId: variant?.id,
        sizeEu: variant?.sizeEu,
        unitPrice,
        quantity: i.quantity,
      });
    }

    const shipping = new Prisma.Decimal("10.00");
    const total = subtotal.add(shipping);
    const count = await tx.order.count();
    const orderNumber = `8511-${String(1000 + count).padStart(6, "0")}`;

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: input.addressId,
        subtotal,
        shipping,
        total,
        items: { create: itemRows },
      },
    });
    return { ok: true as const, orderId: order.id, orderNumber: order.orderNumber };
  });

  if (result.ok) {
    try {
      await sendOwnerEmail({
        subject: `New order ${result.orderNumber}`,
        html: `<h2>New order ${result.orderNumber}</h2>
               <p><b>Customer:</b> ${user.name ?? user.email} (${user.email})</p>
               <p><b>Order ID:</b> ${result.orderId}</p>`,
      });
    } catch (err) {
      console.error("[order] owner email failed (order still placed):", err);
    }
  }
  return result;
}
