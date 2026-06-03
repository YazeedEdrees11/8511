# Customer Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firebase-backed customer accounts (email/password + Google + forgot-password) with three pages, server-side session cookies, and login-gated checkout that emails the owner on each order.

**Architecture:** Firebase Authentication owns identity; the existing MSSQL `User` table (linked by a new `firebaseUid`) owns profile/orders. The browser logs in with the Firebase client SDK, sends its ID token to `/api/auth/session`, which verifies it with the Firebase Admin SDK and sets an httpOnly **session cookie**. Server code reads that cookie via `getCurrentUser()` to gate `placeOrder`.

**Tech Stack:** Next.js 15 (App Router, server actions, route handlers), `firebase` (web SDK), `firebase-admin` (server SDK), Prisma + MSSQL, Tailwind v4, Vitest.

**Prerequisite (already done):** Firebase project `eighty-five-eleven-707eb` created, web + admin config in `.env.local`, Email/Password + Google providers enabled.

---

## File Structure

- `prisma/schema.prisma` — add `User.firebaseUid`, remove `User.passwordHash` (Modify)
- `lib/firebase/client.ts` — Firebase web SDK singleton + `auth`, `googleProvider` (Create)
- `lib/firebase/admin.ts` — Firebase Admin SDK singleton + `adminAuth` (Create)
- `lib/auth/session.ts` — `getCurrentUser()` (Create)
- `app/api/auth/session/route.ts` — POST (login→cookie+upsert), DELETE (logout) (Create)
- `app/login/page.tsx` + `app/login/LoginForm.tsx` (Create)
- `app/signup/page.tsx` + `app/signup/SignupForm.tsx` (Create)
- `app/forgot-password/page.tsx` + `app/forgot-password/ForgotPasswordForm.tsx` (Create)
- `components/layout/Header.tsx` — auth state (Log in ↔ name + Log out) (Modify)
- `app/actions/orders.ts` — session guard + owner email (Modify)
- `.env.docker.example` — document Firebase vars (Modify)
- `tests/lib/auth/session.test.ts` (Create)
- `tests/actions/orders.test.ts` (Create)

---

### Task 1: Schema — link Firebase to the User table

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Edit the `User` model.** Replace the `passwordHash` line with a `firebaseUid` line. Find:

```prisma
  email        String                  @unique
  passwordHash String?
  name         String?
```

Replace with:

```prisma
  email        String                  @unique
  firebaseUid  String?                 @unique
  name         String?
```

- [ ] **Step 2: Create and apply the migration**

Run: `npm run db:migrate -- --name add_firebase_uid`
Expected: migration created under `prisma/migrations/`, applied, Prisma Client regenerated. Ends with "Your database is now in sync with your schema."

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): link User to Firebase via firebaseUid"
```

---

### Task 2: Install Firebase dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install both SDKs**

Run: `npm install firebase firebase-admin --legacy-peer-deps`
Expected: `firebase` and `firebase-admin` added to `package.json` dependencies. (`--legacy-peer-deps` is required in this repo due to a known zod peer conflict.)

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add firebase and firebase-admin"
```

---

### Task 3: Firebase client SDK singleton

**Files:**
- Create: `lib/firebase/client.ts`

- [ ] **Step 1: Write the client initializer**

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from `lib/firebase/client.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/firebase/client.ts
git commit -m "feat(auth): add Firebase client SDK singleton"
```

---

### Task 4: Firebase Admin SDK singleton

**Files:**
- Create: `lib/firebase/admin.ts`

- [ ] **Step 1: Write the admin initializer**

```typescript
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").includes("\\n")
    ? (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n")
    : (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "");
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export const adminAuth = getAuth(getAdminApp());
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from `lib/firebase/admin.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/firebase/admin.ts
git commit -m "feat(auth): add Firebase Admin SDK singleton"
```

---

### Task 5: `getCurrentUser()` session reader (TDD)

**Files:**
- Create: `lib/auth/session.ts`
- Test: `tests/lib/auth/session.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const verifySessionCookie = vi.fn();
const findUnique = vi.fn();
const cookieGet = vi.fn();

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
```

- [ ] **Step 2: Run the test — verify it fails**

Run: `npm test -- tests/lib/auth/session.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/session`.

- [ ] **Step 3: Write the implementation**

```typescript
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
```

- [ ] **Step 4: Run the test — verify it passes**

Run: `npm test -- tests/lib/auth/session.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/session.ts tests/lib/auth/session.test.ts
git commit -m "feat(auth): add getCurrentUser session reader"
```

---

### Task 6: Session route handler (login → cookie + user upsert, logout)

**Files:**
- Create: `app/api/auth/session/route.ts`

- [ ] **Step 1: Write the route handler**

```typescript
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from the route file.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/session/route.ts
git commit -m "feat(auth): add session route handler (login/logout)"
```

---

### Task 7: Shared auth-form helper

**Files:**
- Create: `lib/auth/postSession.ts`

- [ ] **Step 1: Write a tiny client helper** that exchanges a Firebase user for a server session and is reused by all three forms (DRY).

```typescript
import type { User as FirebaseUser } from "firebase/auth";

// Exchanges a signed-in Firebase user's ID token for a server session cookie.
export async function postSession(user: FirebaseUser): Promise<void> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Could not establish session");
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth/postSession.ts
git commit -m "feat(auth): add postSession client helper"
```

---

### Task 8: Login page

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/LoginForm.tsx`

- [ ] **Step 1: Write the page shell** (`app/login/page.tsx`), mirroring the `contact`/`inquire` page layout.

```tsx
import LoginForm from "./LoginForm";

export default function Login() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">ACCOUNT</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">WELCOME BACK.</h1>
      <div className="mt-12 max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the client form** (`app/login/LoginForm.tsx`).

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { postSession } from "@/lib/auth/postSession";

const inputCls = "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";
const btnCls = "bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50";

export default function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function emailLogin(formData: FormData) {
    setBusy(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, String(formData.get("email")), String(formData.get("password")));
      await postSession(cred.user);
      router.push("/");
      router.refresh();
    } catch {
      setError("Wrong email or password.");
    } finally { setBusy(false); }
  }

  async function googleLogin() {
    setBusy(true); setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await postSession(cred.user);
      router.push("/");
      router.refresh();
    } catch {
      setError("Google sign-in failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6">
      <form action={emailLogin} className="grid gap-6">
        <div>
          <label className={labelCls} htmlFor="email">EMAIL</label>
          <input id="email" name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">PASSWORD</label>
          <input id="password" name="password" type="password" required className={inputCls} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${btnCls} justify-self-start`}>
          {busy ? "…" : "LOG IN →"}
        </button>
      </form>
      <button onClick={googleLogin} disabled={busy} className="border border-ink/20 px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:border-accent transition-colors">
        CONTINUE WITH GOOGLE
      </button>
      <div className="flex justify-between font-label text-[11px] tracking-wider2 text-muted">
        <a href="/forgot-password" className="hover:text-accent">FORGOT PASSWORD?</a>
        <a href="/signup" className="hover:text-accent">CREATE ACCOUNT →</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify it renders**

Run: `npm run dev`, open `http://localhost:3000/login`.
Expected: page loads, form + Google button + links show, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/login
git commit -m "feat(auth): add login page"
```

---

### Task 9: Sign-up page

**Files:**
- Create: `app/signup/page.tsx`
- Create: `app/signup/SignupForm.tsx`

- [ ] **Step 1: Write the page shell** (`app/signup/page.tsx`).

```tsx
import SignupForm from "./SignupForm";

export default function Signup() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">ACCOUNT</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">JOIN 8511.</h1>
      <div className="mt-12 max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the client form** (`app/signup/SignupForm.tsx`).

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { postSession } from "@/lib/auth/postSession";

const inputCls = "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";
const btnCls = "bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50";

export default function SignupForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signup(formData: FormData) {
    const password = String(formData.get("password"));
    const confirm = String(formData.get("confirm"));
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, String(formData.get("email")), password);
      await updateProfile(cred.user, { displayName: String(formData.get("name")) });
      await postSession(cred.user);
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not create account (email may already be in use).");
    } finally { setBusy(false); }
  }

  async function googleSignup() {
    setBusy(true); setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await postSession(cred.user);
      router.push("/");
      router.refresh();
    } catch {
      setError("Google sign-in failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6">
      <form action={signup} className="grid gap-6">
        <div>
          <label className={labelCls} htmlFor="name">NAME</label>
          <input id="name" name="name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">EMAIL</label>
          <input id="email" name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">PASSWORD</label>
          <input id="password" name="password" type="password" required minLength={6} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="confirm">CONFIRM PASSWORD</label>
          <input id="confirm" name="confirm" type="password" required minLength={6} className={inputCls} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${btnCls} justify-self-start`}>
          {busy ? "…" : "SIGN UP →"}
        </button>
      </form>
      <button onClick={googleSignup} disabled={busy} className="border border-ink/20 px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:border-accent transition-colors">
        SIGN UP WITH GOOGLE
      </button>
      <div className="font-label text-[11px] tracking-wider2 text-muted">
        <a href="/login" className="hover:text-accent">ALREADY HAVE AN ACCOUNT? LOG IN →</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify it renders**

Run: open `http://localhost:3000/signup`.
Expected: page loads with all fields, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/signup
git commit -m "feat(auth): add sign-up page"
```

---

### Task 10: Forgot-password page

**Files:**
- Create: `app/forgot-password/page.tsx`
- Create: `app/forgot-password/ForgotPasswordForm.tsx`

- [ ] **Step 1: Write the page shell** (`app/forgot-password/page.tsx`).

```tsx
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPassword() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">ACCOUNT</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">RESET PASSWORD.</h1>
      <div className="mt-12 max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the client form** (`app/forgot-password/ForgotPasswordForm.tsx`).

```tsx
"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const inputCls = "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";

export default function ForgotPasswordForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function send(formData: FormData) {
    setState("sending");
    try { await sendPasswordResetEmail(auth, String(formData.get("email"))); }
    catch { /* don't reveal whether the email exists */ }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="border border-ink/15 p-8">
        <p className="font-display text-3xl">CHECK YOUR EMAIL.</p>
        <p className="mt-3 text-base text-ink/80">If an account exists for that address, a reset link is on its way.</p>
      </div>
    );
  }

  return (
    <form action={send} className="grid gap-6">
      <div>
        <label className={labelCls} htmlFor="email">EMAIL</label>
        <input id="email" name="email" type="email" required className={inputCls} />
      </div>
      <button type="submit" disabled={state === "sending"} className="justify-self-start bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50">
        {state === "sending" ? "SENDING…" : "SEND RESET LINK →"}
      </button>
      <a href="/login" className="font-label text-[11px] tracking-wider2 text-muted hover:text-accent">← BACK TO LOG IN</a>
    </form>
  );
}
```

- [ ] **Step 3: Verify it renders**

Run: open `http://localhost:3000/forgot-password`.
Expected: page loads with email field, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/forgot-password
git commit -m "feat(auth): add forgot-password page"
```

---

### Task 11: Header auth state

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Add auth state to the header.** At the top of the component body (after `const cart = useCart();`), add Firebase auth-state tracking and a logout handler. Insert these imports at the top of the file:

```tsx
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
```

Inside the component, after `const cart = useCart();`:

```tsx
  const [displayName, setDisplayName] = useState<string | null>(null);
  useEffect(() => onAuthStateChanged(auth, (u) => setDisplayName(u?.displayName || u?.email || null)), []);

  async function logout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    setDisplayName(null);
    window.location.href = "/";
  }
```

- [ ] **Step 2: Replace the person-icon button** with conditional auth UI. Find this block:

```tsx
        <button className="text-on-surface hover:text-primary transition-colors duration-300 active:opacity-80">
          <span className="material-symbols-outlined">person</span>
        </button>
```

Replace with:

```tsx
        {displayName ? (
          <div className="flex items-center gap-3">
            <span className="hidden md:inline font-label text-[11px] tracking-widest text-on-surface/80">{displayName}</span>
            <button onClick={logout} className="font-label text-[11px] tracking-widest text-on-surface/70 hover:text-primary transition-colors">
              LOG OUT
            </button>
          </div>
        ) : (
          <Link href="/login" className="font-label text-[11px] tracking-widest text-on-surface/70 hover:text-primary transition-colors">
            LOG IN
          </Link>
        )}
```

- [ ] **Step 3: Verify**

Run: open `http://localhost:3000`. Logged out → header shows "LOG IN". After logging in via `/login` → header shows your name + "LOG OUT"; clicking LOG OUT returns to logged-out state.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat(auth): show login state in header"
```

---

### Task 12: Gate checkout + email owner on order (TDD)

**Files:**
- Modify: `app/actions/orders.ts`
- Modify (replace): `tests/actions/orders.test.ts` — **an integration test already exists here that calls `placeOrder({ userId, ... })`. It must be replaced**, because the new design removes `userId` from the input and gates on the session. The replacement mocks `getCurrentUser` (real DB stays for the order creation).

- [ ] **Step 1: Replace the test file** (`tests/actions/orders.test.ts`) entirely with:

```typescript
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

const getCurrentUser = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getCurrentUser }));
vi.mock("@/lib/email", () => ({ sendOwnerEmail: vi.fn() }));

import { prisma } from "@/lib/db";
import { placeOrder } from "@/app/actions/orders";

describe("placeOrder", () => {
  let addressId: number, productId: number, variantId: number;

  beforeAll(async () => {
    const u = await prisma.user.findFirstOrThrow({ include: { addresses: true } });
    addressId = u.addresses[0].id;
    const p = await prisma.product.findFirstOrThrow({ include: { variants: true } });
    productId = p.id;
    variantId = p.variants[0].id;
    // logged-in by default: getCurrentUser resolves to the real user
    getCurrentUser.mockResolvedValue(u);
  });

  afterAll(() => prisma.$disconnect());

  it("creates an order with snapshot prices and an item", async () => {
    const result = await placeOrder({ addressId, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId }, include: { items: true } });
    expect(order.items).toHaveLength(1);
    expect(Number(order.total)).toBeGreaterThan(0);
  });

  it("rejects empty item list", async () => {
    const result = await placeOrder({ addressId, items: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects when not logged in", async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    const result = await placeOrder({ addressId, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("auth required");
  });
});
```

- [ ] **Step 2: Run the test — verify it fails**

Run: `npm test -- tests/actions/orders.test.ts`
Expected: FAIL — `placeOrder` doesn't check auth yet and its input type still requires `userId` (type error / wrong behavior).

- [ ] **Step 3: Update `app/actions/orders.ts`.** Change the input type to drop `userId` (it now comes from the session), and add the guard + owner email. Replace the top of the file (imports + type + start of function) so it reads:

```typescript
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
```

Then inside the transaction change the order's `userId` line from `userId: input.userId,` to:

```typescript
        userId: user.id,
```

And change the transaction's final return + close so the function emails the owner after a successful order. Replace the end of the function (from the `return { ok: true as const, ... }` line through the closing `});`) with:

```typescript
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
```

- [ ] **Step 4: Run the test — verify it passes**

Run: `npm test -- tests/actions/orders.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/orders.ts tests/actions/orders.test.ts
git commit -m "feat(orders): gate checkout behind auth and email owner"
```

---

### Task 13: Document env vars + final verification

**Files:**
- Modify: `.env.docker.example`

- [ ] **Step 1: Append the Firebase vars** to `.env.docker.example`:

```
# Firebase web app (public client keys)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-side, SECRET)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all tests pass (including the new `session` and `orders` tests).

- [ ] **Step 3: Manual end-to-end check** (`npm run dev`, DB up via `docker compose up -d mssql`):
  - Sign up with email at `/signup` → lands logged in, header shows name.
  - Log out → header shows LOG IN.
  - Log in at `/login` → works.
  - "Continue with Google" → works.
  - `/forgot-password` with your email → reset email arrives.
  - Add an item to cart, attempt checkout while logged out → rejected ("auth required"); log in → checkout succeeds; owner email arrives; a `User` row with `firebaseUid` exists (`npm run db:studio`).

- [ ] **Step 4: Commit**

```bash
git add .env.docker.example
git commit -m "docs: document Firebase env vars"
```
