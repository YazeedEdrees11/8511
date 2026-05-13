import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return new Response(JSON.stringify({ error: "invalid id" }), { status: 400 });
  }
  const body = (await req.json()) as { quantity: number };
  if (typeof body.quantity !== "number") {
    return new Response(JSON.stringify({ error: "quantity required" }), { status: 400 });
  }
  if (body.quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: numeric } }).catch(() => null);
  } else {
    await prisma.cartItem.update({
      where: { id: numeric },
      data: { quantity: body.quantity },
    }).catch(() => null);
  }
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return new Response(JSON.stringify({ error: "invalid id" }), { status: 400 });
  }
  await prisma.cartItem.delete({ where: { id: numeric } }).catch(() => null);
  return Response.json({ ok: true });
}
