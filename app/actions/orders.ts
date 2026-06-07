"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getCurrentUserWithVerification } from "@/lib/auth/session";
import { sendOwnerEmail } from "@/lib/email";
import { cookies } from "next/headers";

// Shown when a logged-in but unverified user tries to place an order. Kept in
// one place so placeOrder and checkout stay in sync.
const EMAIL_NOT_VERIFIED_ERROR =
  "Please verify your email before placing an order. Check your inbox for the verification link.";

export type PlaceOrderInput = {
  addressId: number;
  items: { productId: number; variantId?: number; quantity: number }[];
};

export type PlaceOrderResult =
  | { ok: true; orderId: number; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const auth = await getCurrentUserWithVerification();
  if (!auth) return { ok: false, error: "auth required" };
  const { user, emailVerified } = auth;
  if (!emailVerified) {
    return { ok: false, error: EMAIL_NOT_VERIFIED_ERROR };
  }
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

export type AddressInput = {
  line1: string;
  line2?: string;
  city: string;
  country: string;
  postal?: string;
};

export async function checkout(input: {
  address: AddressInput;
  items: PlaceOrderInput["items"];
}): Promise<PlaceOrderResult> {
  const auth = await getCurrentUserWithVerification();
  if (!auth) return { ok: false, error: "auth required" };
  if (!auth.emailVerified) {
    return { ok: false, error: EMAIL_NOT_VERIFIED_ERROR };
  }
  if (!input.items.length) return { ok: false, error: "no items" };

  const addr = await prisma.address.create({
    data: {
      userId: auth.user.id,
      line1: input.address.line1,
      line2: input.address.line2 || null,
      city: input.address.city,
      country: input.address.country,
      postal: input.address.postal || null,
    },
  });

  const result = await placeOrder({ addressId: addr.id, items: input.items });

  if (result.ok) {
    try {
      const sid = (await cookies()).get("cart_sid")?.value;
      if (sid) await prisma.cart.deleteMany({ where: { sessionId: sid, userId: null } });
    } catch (err) {
      console.error("[checkout] cart clear failed (order still placed):", err);
    }
  } else {
    // The order failed after we created the address — remove the orphan so it
    // doesn't linger unattached to any order.
    await prisma.address
      .delete({ where: { id: addr.id } })
      .catch((err) => console.error("[checkout] orphan address cleanup failed:", err));
  }
  return result;
}
