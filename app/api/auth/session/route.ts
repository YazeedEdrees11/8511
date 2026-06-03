import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth/session";

const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ ok: false, error: "missing idToken" }, { status: 400 });

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      create: { firebaseUid: decoded.uid, email: decoded.email ?? "", name: decoded.name ?? null },
      update: { email: decoded.email ?? "" },
    });
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: FIVE_DAYS_MS });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: FIVE_DAYS_MS / 1000,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
