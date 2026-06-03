import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "session";

export async function getCurrentUser(): Promise<User | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE);
  if (!cookie?.value) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie.value);
    return await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
  } catch {
    return null;
  }
}
