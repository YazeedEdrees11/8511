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

// Reads the user AND their fresh email-verified status straight from Firebase
// (not the session-cookie claim, which is captured before the user clicks the
// verification link). Used to gate checkout.
export async function getCurrentUserWithVerification(): Promise<
  { user: User; emailVerified: boolean } | null
> {
  const cookie = (await cookies()).get(SESSION_COOKIE);
  if (!cookie?.value) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie.value);
    const user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!user) return null;
    const fbUser = await adminAuth.getUser(decoded.uid);
    return { user, emailVerified: fbUser.emailVerified };
  } catch {
    return null;
  }
}
