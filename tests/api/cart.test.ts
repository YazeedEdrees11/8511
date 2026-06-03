import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { POST, GET, DELETE as CLEAR_CART } from "@/app/api/cart/route";
import { DELETE, PATCH } from "@/app/api/cart/[id]/route";

async function postJson(url: string, body: unknown, cookie?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers["cookie"] = cookie;
  return new Request(url, { method: "POST", headers, body: JSON.stringify(body) });
}
async function getReq(url: string, cookie?: string) {
  const headers: Record<string, string> = {};
  if (cookie) headers["cookie"] = cookie;
  return new Request(url, { method: "GET", headers });
}

describe("cart api", () => {
  let productId: number;
  let variantId: number;

  beforeAll(async () => {
    const p = await prisma.product.findFirstOrThrow({ include: { variants: true } });
    productId = p.id;
    variantId = p.variants[0].id;
  });

  afterEach(async () => {
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({ where: { userId: null } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("POST creates a guest cart and adds an item, returning a session cookie", async () => {
    const res = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 1 }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/cart_sid=/);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].productId).toBe(productId);
    expect(body.items[0].productSlug).toBeDefined();
  });

  it("GET returns the cart belonging to the session cookie", async () => {
    const postRes = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 2 }));
    const cookie = postRes.headers.get("set-cookie")!.split(";")[0];
    const getRes = await GET(await getReq("http://test/api/cart", cookie));
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.items[0].quantity).toBe(2);
    expect(body.items[0].productSlug).toBeDefined();
  });

  it("POST merges quantity when adding the same product+variant again", async () => {
    const r1 = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 1 }));
    const cookie = r1.headers.get("set-cookie")!.split(";")[0];
    const r2 = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 2 }, cookie));
    const body = await r2.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].quantity).toBe(3);
  });

  it("PATCH updates a cart item's quantity", async () => {
    const postRes = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 1 }));
    const cookie = postRes.headers.get("set-cookie")!.split(";")[0];
    const { items } = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    const itemId = items[0].id;
    const res = await PATCH(
      new Request(`http://test/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ quantity: 5 }),
      }),
      { params: Promise.resolve({ id: String(itemId) }) }
    );
    expect(res.status).toBe(200);
    const after = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    expect(after.items[0].quantity).toBe(5);
  });

  it("PATCH with quantity 0 removes the item", async () => {
    const postRes = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 1 }));
    const cookie = postRes.headers.get("set-cookie")!.split(";")[0];
    const { items } = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    const itemId = items[0].id;
    await PATCH(
      new Request(`http://test/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ quantity: 0 }),
      }),
      { params: Promise.resolve({ id: String(itemId) }) }
    );
    const after = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    expect(after.items).toHaveLength(0);
  });

  it("DELETE removes a cart item", async () => {
    const postRes = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 1 }));
    const cookie = postRes.headers.get("set-cookie")!.split(";")[0];
    const { items } = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    const itemId = items[0].id;
    const delRes = await DELETE(new Request(`http://test/api/cart/${itemId}`, { method: "DELETE", headers: { cookie } }), { params: Promise.resolve({ id: String(itemId) }) });
    expect(delRes.status).toBe(200);
    const after = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    expect(after.items).toHaveLength(0);
  });

  it("DELETE /api/cart empties the whole guest cart and expires the cart_sid cookie", async () => {
    const postRes = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 2 }));
    const cookie = postRes.headers.get("set-cookie")!.split(";")[0];
    const clearRes = await CLEAR_CART(new Request("http://test/api/cart", { method: "DELETE", headers: { cookie } }));
    expect(clearRes.status).toBe(200);
    expect(clearRes.headers.get("set-cookie") ?? "").toMatch(/cart_sid=;.*Max-Age=0/i);
    const after = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    expect(after.items).toHaveLength(0);
  });
});
