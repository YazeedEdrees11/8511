import { describe, it, expect, vi, beforeEach } from "vitest";

const { verifySessionCookie, findUnique, cookieGet } = vi.hoisted(() => ({
  verifySessionCookie: vi.fn(),
  findUnique: vi.fn(),
  cookieGet: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({ adminAuth: { verifySessionCookie } }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique } } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));

import { getCurrentUser } from "@/lib/auth/session";

describe("getCurrentUser", () => {
  beforeEach(() => { verifySessionCookie.mockReset(); findUnique.mockReset(); cookieGet.mockReset(); });

  it("returns null when no session cookie", async () => {
    cookieGet.mockReturnValue(undefined);
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns null when cookie verification throws", async () => {
    cookieGet.mockReturnValue({ value: "bad" });
    verifySessionCookie.mockRejectedValue(new Error("invalid"));
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns the user when the cookie verifies", async () => {
    cookieGet.mockReturnValue({ value: "good" });
    verifySessionCookie.mockResolvedValue({ uid: "abc123" });
    findUnique.mockResolvedValue({ id: 7, firebaseUid: "abc123", email: "a@b.com" });
    const u = await getCurrentUser();
    expect(u?.id).toBe(7);
    expect(findUnique).toHaveBeenCalledWith({ where: { firebaseUid: "abc123" } });
  });
});
