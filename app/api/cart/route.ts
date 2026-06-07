import { prisma } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const COOKIE = "cart_sid";

function readSid(req: Request): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === COOKIE) return v ?? null;
  }
  return null;
}

function setSidHeader(sid: string): HeadersInit {
  return {
    "set-cookie": `${COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
    "content-type": "application/json",
  };
}

const itemInclude = {
  items: {
    include: {
      product: { select: { slug: true } },
      variant: { select: { sizeEu: true } },
    },
    orderBy: { id: "asc" as const },
  },
};

type CartRow = Awaited<ReturnType<typeof prisma.cart.findFirstOrThrow<{ include: typeof itemInclude }>>>;

function enrich(cart: CartRow | { items: [] } | null) {
  if (!cart) return { items: [] };
  return {
    ...cart,
    items: cart.items.map(it => ({
      id: it.id,
      cartId: it.cartId,
      productId: it.productId,
      variantId: it.variantId,
      quantity: it.quantity,
      productSlug: it.product.slug,
      sizeEu: it.variant?.sizeEu ?? null,
    })),
  };
}

async function getOrCreateCart(sid: string) {
  const existing = await prisma.cart.findFirst({
    where: { sessionId: sid, userId: null },
    include: itemInclude,
  });
  if (existing) return existing;
  return prisma.cart.create({
    data: { sessionId: sid },
    include: itemInclude,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    productId: number;
    variantId?: number;
    quantity?: number;
  };
  if (!body.productId) {
    return new Response(JSON.stringify({ error: "productId required" }), { status: 400 });
  }
  let sid = readSid(req);
  const isNew = !sid;
  if (!sid) sid = randomUUID();

  const cart = await getOrCreateCart(sid);

  // If an identical product+variant already exists, increment instead of duplicating
  const existingItem = cart.items.find(
    it => it.productId === body.productId && (it.variantId ?? null) === (body.variantId ?? null)
  );
  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + (body.quantity ?? 1) },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: body.productId,
        variantId: body.variantId,
        quantity: body.quantity ?? 1,
      },
    });
  }

  const fresh = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: itemInclude,
  });
  return new Response(JSON.stringify(enrich(fresh)), {
    status: 200,
    headers: isNew ? setSidHeader(sid) : { "content-type": "application/json" },
  });
}

export async function GET(req: Request) {
  const sid = readSid(req);
  if (!sid) return Response.json({ items: [] });
  const cart = await prisma.cart.findFirst({
    where: { sessionId: sid, userId: null },
    include: itemInclude,
  });
  return Response.json(enrich(cart));
}

// Clears the entire guest cart (used on logout): deletes the cart row (items
// cascade) and expires the cart_sid cookie so a fresh cart starts next time.
export async function DELETE(req: Request) {
  const sid = readSid(req);
  if (sid) {
    await prisma.cart.deleteMany({ where: { sessionId: sid, userId: null } });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "set-cookie": `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      "content-type": "application/json",
    },
  });
}
