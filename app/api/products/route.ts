import { loadProducts } from "@/lib/catalog";
export const runtime = "nodejs";
export async function GET() {
  return Response.json(loadProducts());
}
