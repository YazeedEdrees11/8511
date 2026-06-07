# Auth Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Google logo to the auth buttons, add link-based email verification that gates checkout, and add a color-coded password-strength bar to signup.

**Architecture:** Build on the existing Firebase Auth setup. The Google logo is a shared inline SVG. Email verification uses Firebase's native `sendEmailVerification`; the checkout gate reads fresh verification status server-side via the Admin SDK in `placeOrder`. The strength bar uses lazy-loaded `@zxcvbn-ts` with a small pure helper for score→label/color mapping.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Firebase Auth (`firebase` + `firebase-admin`), Prisma + MSSQL, Vitest, Tailwind v4, `@zxcvbn-ts/core`.

**Note on existing code:** The cart drawer `CHECKOUT` button is currently a placeholder (it does not call `placeOrder`). Tasks 12–15 make checkout real: a `/checkout` page collects a shipping address and calls a new `checkout` server action that creates the address and delegates to `placeOrder`. The enforceable verification gate lives server-side in `placeOrder`/`checkout` (both unit-tested); the cart banner is a client-side nudge only.

---

### Task 1: Install zxcvbn-ts dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the packages**

Run:
```bash
npm install @zxcvbn-ts/core @zxcvbn-ts/language-common @zxcvbn-ts/language-en --legacy-peer-deps
```
Expected: packages added to `dependencies`, no fatal errors (the repo has a known zod peer conflict, hence `--legacy-peer-deps`).

- [ ] **Step 2: Verify they resolve**

Run:
```bash
node -e "require.resolve('@zxcvbn-ts/core'); require.resolve('@zxcvbn-ts/language-common'); require.resolve('@zxcvbn-ts/language-en'); console.log('ok')"
```
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add @zxcvbn-ts for password strength meter"
```

---

### Task 2: Google logo on the auth buttons

**Files:**
- Create: `components/icons/GoogleIcon.tsx`
- Modify: `app/login/LoginForm.tsx` (the Google button, lines ~57-59)
- Modify: `app/signup/SignupForm.tsx` (the Google button, lines ~69-71)

- [ ] **Step 1: Create the GoogleIcon component**

Create `components/icons/GoogleIcon.tsx`:
```tsx
export default function GoogleIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
```

- [ ] **Step 2: Wire it into the login Google button**

In `app/login/LoginForm.tsx`, add the import after the existing imports:
```tsx
import GoogleIcon from "@/components/icons/GoogleIcon";
```
Replace the Google button (currently lines ~57-59) with:
```tsx
      <button onClick={googleLogin} disabled={busy} className="flex items-center justify-center gap-3 border border-ink/20 px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:border-accent transition-colors disabled:opacity-50">
        <GoogleIcon />
        CONTINUE WITH GOOGLE
      </button>
```

- [ ] **Step 3: Wire it into the signup Google button**

In `app/signup/SignupForm.tsx`, add the import after the existing imports:
```tsx
import GoogleIcon from "@/components/icons/GoogleIcon";
```
Replace the Google button (currently lines ~69-71) with:
```tsx
      <button onClick={googleSignup} disabled={busy} className="flex items-center justify-center gap-3 border border-ink/20 px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:border-accent transition-colors disabled:opacity-50">
        <GoogleIcon />
        SIGN UP WITH GOOGLE
      </button>
```

- [ ] **Step 4: Verify it compiles and renders**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors. Then manually load `http://localhost:3000/login` and `http://localhost:3000/signup` and confirm the colored Google "G" appears left of the button text.

- [ ] **Step 5: Commit**

```bash
git add components/icons/GoogleIcon.tsx app/login/LoginForm.tsx app/signup/SignupForm.tsx
git commit -m "feat(auth): add Google logo to sign-in buttons"
```

---

### Task 3: Password strength helper (pure, tested)

**Files:**
- Create: `lib/auth/passwordStrength.ts`
- Test: `tests/lib/auth/passwordStrength.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/auth/passwordStrength.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { strengthMeta, MIN_ACCEPTABLE_SCORE } from "@/lib/auth/passwordStrength";

describe("strengthMeta", () => {
  it("maps score 0 and 1 to Weak/red with 1 filled segment", () => {
    expect(strengthMeta(0)).toMatchObject({ label: "Weak", filled: 1 });
    expect(strengthMeta(1)).toMatchObject({ label: "Weak", filled: 1 });
    expect(strengthMeta(0).colorClass).toContain("red");
  });
  it("maps score 2 to Fair/orange with 2 filled segments", () => {
    expect(strengthMeta(2)).toMatchObject({ label: "Fair", filled: 2 });
    expect(strengthMeta(2).colorClass).toContain("orange");
  });
  it("maps score 3 to Good/yellow with 3 filled segments", () => {
    expect(strengthMeta(3)).toMatchObject({ label: "Good", filled: 3 });
    expect(strengthMeta(3).colorClass).toContain("yellow");
  });
  it("maps score 4 to Strong/green with 4 filled segments", () => {
    expect(strengthMeta(4)).toMatchObject({ label: "Strong", filled: 4 });
    expect(strengthMeta(4).colorClass).toContain("green");
  });
  it("exposes a minimum acceptable score of 2", () => {
    expect(MIN_ACCEPTABLE_SCORE).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run tests/lib/auth/passwordStrength.test.ts
```
Expected: FAIL — cannot resolve `@/lib/auth/passwordStrength`.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/passwordStrength.ts`:
```ts
export const MIN_ACCEPTABLE_SCORE = 2;

export type StrengthMeta = {
  label: "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string; // tailwind bg-* class for the filled segments
  filled: number; // 1..4 segments filled
};

// Maps a zxcvbn score (0-4) to UI metadata for the strength bar.
export function strengthMeta(score: number): StrengthMeta {
  switch (score) {
    case 4:
      return { label: "Strong", colorClass: "bg-green-500", filled: 4 };
    case 3:
      return { label: "Good", colorClass: "bg-yellow-400", filled: 3 };
    case 2:
      return { label: "Fair", colorClass: "bg-orange-400", filled: 2 };
    default:
      return { label: "Weak", colorClass: "bg-red-500", filled: 1 };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run tests/lib/auth/passwordStrength.test.ts
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/passwordStrength.ts tests/lib/auth/passwordStrength.test.ts
git commit -m "feat(auth): add password strength score-to-UI helper"
```

---

### Task 4: PasswordStrengthBar component (lazy zxcvbn)

**Files:**
- Create: `components/auth/PasswordStrengthBar.tsx`

- [ ] **Step 1: Create the component**

Create `components/auth/PasswordStrengthBar.tsx`:
```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { strengthMeta } from "@/lib/auth/passwordStrength";

type ZxcvbnResult = { score: number; feedback: { warning: string; suggestions: string[] } };
let zxcvbnFn: ((pw: string) => ZxcvbnResult) | null = null;

// Lazy-load zxcvbn-ts so it stays out of the initial bundle.
async function loadZxcvbn() {
  if (zxcvbnFn) return zxcvbnFn;
  const [core, common, en] = await Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
    import("@zxcvbn-ts/language-en"),
  ]);
  core.zxcvbnOptions.setOptions({
    dictionary: { ...common.dictionary, ...en.dictionary },
    graphs: common.adjacencyGraphs,
    translations: en.translations,
  });
  zxcvbnFn = (pw: string) => core.zxcvbn(pw) as ZxcvbnResult;
  return zxcvbnFn;
}

export default function PasswordStrengthBar({
  password,
  onScore,
}: {
  password: string;
  onScore?: (score: number) => void;
}) {
  const [result, setResult] = useState<ZxcvbnResult | null>(null);
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  useEffect(() => {
    let cancelled = false;
    if (!password) {
      setResult(null);
      onScoreRef.current?.(0);
      return;
    }
    loadZxcvbn().then((fn) => {
      if (cancelled) return;
      const r = fn(password);
      setResult(r);
      onScoreRef.current?.(r.score);
    });
    return () => {
      cancelled = true;
    };
  }, [password]);

  if (!password) return null;

  const meta = strengthMeta(result?.score ?? 0);
  const tip = result?.feedback.warning || result?.feedback.suggestions[0] || "";

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-sm transition-colors ${
              i < meta.filled ? meta.colorClass : "bg-ink/15"
            }`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-label text-[10px] tracking-wider2 text-muted">
        <span>{meta.label}</span>
        {tip && <span className="text-right max-w-[70%]">{tip}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors. (If zxcvbn-ts types complain about `dictionary`/`graphs` shapes, the `as ZxcvbnResult` cast and spreads above are intentional; only fix genuine errors.)

- [ ] **Step 3: Commit**

```bash
git add components/auth/PasswordStrengthBar.tsx
git commit -m "feat(auth): add lazy-loaded password strength bar component"
```

---

### Task 5: Wire the strength bar into signup + block weak passwords

**Files:**
- Modify: `app/signup/SignupForm.tsx`

- [ ] **Step 1: Add imports and state**

In `app/signup/SignupForm.tsx`, add to the imports:
```tsx
import PasswordStrengthBar from "@/components/auth/PasswordStrengthBar";
import { MIN_ACCEPTABLE_SCORE } from "@/lib/auth/passwordStrength";
```
Inside the component, after the existing `const [error, setError] = useState("");` line, add:
```tsx
  const [password, setPassword] = useState("");
  const [pwScore, setPwScore] = useState(0);
```

- [ ] **Step 2: Guard the submit handler**

In the `signup` function, after `const confirm = String(formData.get("confirm"));` and the existing match check, add a strength guard:
```tsx
    if (pwScore < MIN_ACCEPTABLE_SCORE) { setError("Please choose a stronger password."); return; }
```

- [ ] **Step 3: Make the password input controlled and add the bar**

Replace the password field block (currently lines ~56-59) with:
```tsx
        <div>
          <label className={labelCls} htmlFor="password">PASSWORD</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          <PasswordStrengthBar password={password} onScore={setPwScore} />
        </div>
```

- [ ] **Step 4: Disable submit until acceptable**

Replace the submit button (currently lines ~65-67) with:
```tsx
        <button type="submit" disabled={busy || pwScore < MIN_ACCEPTABLE_SCORE} className={`${btnCls} justify-self-start`}>
          {busy ? "…" : "SIGN UP →"}
        </button>
```

- [ ] **Step 5: Verify build + manual check**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors. Then on `http://localhost:3000/signup`: typing `aaa` shows a red "Weak" bar and the SIGN UP button stays disabled; typing something like `correct-horse-battery` turns it green/orange and enables the button.

- [ ] **Step 6: Commit**

```bash
git add app/signup/SignupForm.tsx
git commit -m "feat(auth): show password strength bar and block weak passwords on signup"
```

---

### Task 6: Add server helper for fresh verification status

**Files:**
- Modify: `lib/auth/session.ts`

- [ ] **Step 1: Add the helper**

In `lib/auth/session.ts`, append after `getCurrentUser`:
```ts
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
```

- [ ] **Step 2: Verify it typechecks**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/session.ts
git commit -m "feat(auth): add getCurrentUserWithVerification helper"
```

---

### Task 7: Gate checkout on verification in placeOrder

**Files:**
- Modify: `app/actions/orders.ts` (lines ~5, ~17-20)
- Modify: `tests/actions/orders.test.ts`

- [ ] **Step 1: Update the test to mock the new helper and cover verification**

Replace the top of `tests/actions/orders.test.ts` (the mock setup, lines 1-21) with:
```ts
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

const { getCurrentUserWithVerification } = vi.hoisted(() => ({
  getCurrentUserWithVerification: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserWithVerification }));
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
    // logged-in AND verified by default
    getCurrentUserWithVerification.mockResolvedValue({ user: u, emailVerified: true });
  });
```
Then replace the existing `"rejects when not logged in"` test (lines ~39-45) with these two tests:
```ts
  it("rejects when not logged in", async () => {
    getCurrentUserWithVerification.mockResolvedValueOnce(null);
    const result = await placeOrder({ addressId, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("auth required");
  });

  it("rejects when email is not verified", async () => {
    const u = await prisma.user.findFirstOrThrow();
    getCurrentUserWithVerification.mockResolvedValueOnce({ user: u, emailVerified: false });
    const result = await placeOrder({ addressId, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toMatch(/verify your email/i);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run tests/actions/orders.test.ts
```
Expected: FAIL — `placeOrder` still imports/calls `getCurrentUser`, so the new mock isn't used and the verification test fails (or import error).

- [ ] **Step 3: Update placeOrder**

In `app/actions/orders.ts`, change the import on line 5 from:
```ts
import { getCurrentUser } from "@/lib/auth/session";
```
to:
```ts
import { getCurrentUserWithVerification } from "@/lib/auth/session";
```
Then replace lines ~18-20 (the auth check) with:
```ts
  const auth = await getCurrentUserWithVerification();
  if (!auth) return { ok: false, error: "auth required" };
  const { user, emailVerified } = auth;
  if (!emailVerified) {
    return {
      ok: false,
      error: "Please verify your email before placing an order. Check your inbox for the verification link.",
    };
  }
  if (!input.items.length) return { ok: false, error: "no items" };
```
(The rest of the function already uses `user.id` and `user.email`, which still resolve.)

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run tests/actions/orders.test.ts
```
Expected: PASS (4 tests: creates order, rejects empty, rejects not-logged-in, rejects unverified).

- [ ] **Step 5: Commit**

```bash
git add app/actions/orders.ts tests/actions/orders.test.ts
git commit -m "feat(checkout): block orders until email is verified"
```

---

### Task 8: Send verification email and redirect on signup

**Files:**
- Modify: `app/signup/SignupForm.tsx`

- [ ] **Step 1: Import sendEmailVerification**

In `app/signup/SignupForm.tsx`, change the firebase/auth import to include `sendEmailVerification`:
```tsx
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, sendEmailVerification } from "firebase/auth";
```

- [ ] **Step 2: Send the email and redirect to /verify-email**

In the `signup` function, replace the success block (currently the lines that do `updateProfile`, `postSession`, `router.push("/")`, `router.refresh()`) with:
```tsx
      const cred = await createUserWithEmailAndPassword(auth, String(formData.get("email")), password);
      await updateProfile(cred.user, { displayName: String(formData.get("name")) });
      await sendEmailVerification(cred.user);
      await postSession(cred.user);
      router.push("/verify-email");
      router.refresh();
```
(Leave the `googleSignup` function as-is — Google users are auto-verified and still go to `/`.)

- [ ] **Step 3: Verify build**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add app/signup/SignupForm.tsx
git commit -m "feat(auth): send verification email and route to /verify-email on signup"
```

---

### Task 9: The /verify-email page with Resend

**Files:**
- Create: `app/verify-email/page.tsx`
- Create: `app/verify-email/VerifyEmailClient.tsx`

- [ ] **Step 1: Create the server page wrapper**

Create `app/verify-email/page.tsx`:
```tsx
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <main className="max-w-md mx-auto px-6 py-24">
      <h1 className="font-headline text-3xl uppercase tracking-tight mb-4">VERIFY YOUR EMAIL</h1>
      <VerifyEmailClient />
    </main>
  );
}
```

- [ ] **Step 2: Create the client component**

Create `app/verify-email/VerifyEmailClient.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, sendEmailVerification, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const btnCls = "bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50";

export default function VerifyEmailClient() {
  const [user, setUser] = useState<User | null>(null);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() =>
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await u.reload();
        setVerified(u.emailVerified);
      }
    }), []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!auth.currentUser) return;
    setMsg("");
    try {
      await sendEmailVerification(auth.currentUser);
      setMsg("Verification email sent — check your inbox.");
      setCooldown(30);
    } catch {
      setMsg("Could not send right now. Please wait a moment and try again.");
    }
  }

  if (!user) {
    return (
      <p className="font-body text-sm text-muted">
        You are not signed in. <a href="/login" className="text-accent">Log in</a> to verify your email.
      </p>
    );
  }

  if (verified) {
    return (
      <div className="grid gap-4">
        <p className="font-body text-sm">Your email is verified ✓ You can now place orders.</p>
        <a href="/" className={`${btnCls} justify-self-start`}>CONTINUE →</a>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="font-body text-sm text-muted">
        We sent a verification link to <b>{user.email}</b>. Click it to verify your account, then return here.
      </p>
      <button onClick={resend} disabled={cooldown > 0} className={`${btnCls} justify-self-start`}>
        {cooldown > 0 ? `RESEND IN ${cooldown}s` : "RESEND EMAIL"}
      </button>
      {msg && <p className="font-body text-sm text-muted">{msg}</p>}
      <a href="/" className="font-label text-[11px] tracking-wider2 text-muted hover:text-accent">CONTINUE BROWSING →</a>
    </div>
  );
}
```

- [ ] **Step 3: Verify build + manual check**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors. Then sign up with a real email; you should land on `/verify-email`, receive an email, and see the Resend button with a 30s cooldown after clicking.

- [ ] **Step 4: Commit**

```bash
git add app/verify-email/page.tsx app/verify-email/VerifyEmailClient.tsx
git commit -m "feat(auth): add /verify-email page with resend"
```

---

### Task 10: Unverified reminder banner in the cart

**Files:**
- Create: `components/auth/VerifyBanner.tsx`
- Modify: `components/cart/CartDrawer.tsx` (footer, before the CHECKOUT button ~line 159)

- [ ] **Step 1: Create the banner component**

Create `components/auth/VerifyBanner.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Client-side nudge only. The real gate is server-side in placeOrder.
export default function VerifyBanner() {
  const [show, setShow] = useState(false);

  useEffect(() =>
    onAuthStateChanged(auth, (u) => {
      setShow(!!u && !u.emailVerified);
    }), []);

  if (!show) return null;

  return (
    <a
      href="/verify-email"
      className="block border border-orange-400 bg-orange-50 text-[#0A0A0A] px-4 py-3 text-[11px] font-label tracking-widest uppercase hover:bg-orange-100 transition-colors"
    >
      Verify your email to place an order →
    </a>
  );
}
```

- [ ] **Step 2: Drop it into the cart footer**

In `components/cart/CartDrawer.tsx`, add the import after the existing imports:
```tsx
import VerifyBanner from "@/components/auth/VerifyBanner";
```
Then inside the `<footer>` block, immediately before the `<button ... >CHECKOUT</button>` (currently ~line 159), add:
```tsx
            <VerifyBanner />
```

- [ ] **Step 3: Verify build + manual check**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors. Then: while logged in as an unverified user with an item in the cart, open the cart — the orange banner shows. As a verified/Google user, it does not.

- [ ] **Step 4: Commit**

```bash
git add components/auth/VerifyBanner.tsx components/cart/CartDrawer.tsx
git commit -m "feat(cart): nudge unverified users to verify before checkout"
```

---

### Task 11: Expose cart refresh on the context

**Files:**
- Modify: `components/cart/CartProvider.tsx`

- [ ] **Step 1: Add `refresh` to the CartState type**

In `components/cart/CartProvider.tsx`, in the `CartState` type, add after `updateQuantity`:
```tsx
  refresh: () => Promise<void>;
```

- [ ] **Step 2: Expose it on the provider value**

In the `<CartContext.Provider value={{ ... }}>` object, add `refresh,` alongside the other methods (e.g. after `updateQuantity,`). The `refresh` callback already exists in the component.

- [ ] **Step 3: Verify build**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add components/cart/CartProvider.tsx
git commit -m "feat(cart): expose refresh on cart context"
```

---

### Task 12: Add the checkout server action

**Files:**
- Modify: `app/actions/orders.ts`
- Test: `tests/actions/checkout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/actions/checkout.test.ts`:
```ts
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

const { getCurrentUserWithVerification } = vi.hoisted(() => ({
  getCurrentUserWithVerification: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserWithVerification }));
vi.mock("@/lib/email", () => ({ sendOwnerEmail: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

import { prisma } from "@/lib/db";
import { checkout } from "@/app/actions/orders";

const address = { line1: "1 Test St", city: "Amman", country: "Jordan" };

describe("checkout", () => {
  let productId: number, variantId: number, userId: number;

  beforeAll(async () => {
    const u = await prisma.user.findFirstOrThrow();
    userId = u.id;
    const p = await prisma.product.findFirstOrThrow({ include: { variants: true } });
    productId = p.id;
    variantId = p.variants[0].id;
    getCurrentUserWithVerification.mockResolvedValue({ user: u, emailVerified: true });
  });

  afterAll(() => prisma.$disconnect());

  it("creates an address and an order for a verified user", async () => {
    const result = await checkout({ address, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId }, include: { address: true } });
    expect(order.address.line1).toBe("1 Test St");
    expect(order.address.userId).toBe(userId);
  });

  it("rejects an unverified user", async () => {
    const u = await prisma.user.findFirstOrThrow();
    getCurrentUserWithVerification.mockResolvedValueOnce({ user: u, emailVerified: false });
    const result = await checkout({ address, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toMatch(/verify your email/i);
  });

  it("rejects when not logged in", async () => {
    getCurrentUserWithVerification.mockResolvedValueOnce(null);
    const result = await checkout({ address, items: [{ productId, variantId, quantity: 1 }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("auth required");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npx vitest run tests/actions/checkout.test.ts
```
Expected: FAIL — `checkout` is not exported from `@/app/actions/orders`.

- [ ] **Step 3: Implement the checkout action**

In `app/actions/orders.ts`, add `cookies` to the imports at the top:
```ts
import { cookies } from "next/headers";
```
Then append at the end of the file:
```ts
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
    return {
      ok: false,
      error: "Please verify your email before placing an order. Check your inbox for the verification link.",
    };
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
  }
  return result;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx vitest run tests/actions/checkout.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/actions/orders.ts tests/actions/checkout.test.ts
git commit -m "feat(checkout): add checkout server action (address + placeOrder)"
```

---

### Task 13: Build the /checkout page

**Files:**
- Create: `app/checkout/page.tsx`
- Create: `app/checkout/CheckoutClient.tsx`

- [ ] **Step 1: Create the server page wrapper**

Create `app/checkout/page.tsx`:
```tsx
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-headline text-4xl uppercase tracking-tight mb-8">CHECKOUT</h1>
      <CheckoutClient />
    </main>
  );
}
```

- [ ] **Step 2: Create the client component**

Create `app/checkout/CheckoutClient.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useCart } from "@/components/cart/CartProvider";
import { useCartProducts } from "@/components/cart/useCartProducts";
import { checkout, type AddressInput } from "@/app/actions/orders";
import VerifyBanner from "@/components/auth/VerifyBanner";

const inputCls = "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";
const btnCls = "bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50";

function parsePrice(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export default function CheckoutClient() {
  const cart = useCart();
  const products = useCartProducts();
  const productBySlug = new Map((products ?? []).map((p) => [p.slug, p]));
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setLoggedIn(!!u)), []);

  const subtotal = cart.items.reduce(
    (sum, item) => sum + parsePrice(productBySlug.get(item.productSlug)?.price) * item.quantity,
    0
  );
  const shipping = cart.items.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  async function placeOrderAction(formData: FormData) {
    setBusy(true);
    setError("");
    const address: AddressInput = {
      line1: String(formData.get("line1")),
      line2: String(formData.get("line2") || ""),
      city: String(formData.get("city")),
      country: String(formData.get("country")),
      postal: String(formData.get("postal") || ""),
    };
    const items = cart.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId ?? undefined,
      quantity: i.quantity,
    }));
    const result = await checkout({ address, items });
    if (result.ok) {
      setOrderNumber(result.orderNumber);
      await cart.refresh();
    } else {
      setError(result.error);
    }
    setBusy(false);
  }

  if (orderNumber) {
    return (
      <div className="grid gap-4">
        <p className="font-body text-lg">Thank you — your order <b>{orderNumber}</b> has been placed.</p>
        <p className="font-body text-sm text-muted">We've emailed the shop and will be in touch about your order.</p>
        <a href="/" className={`${btnCls} justify-self-start`}>BACK TO HOME →</a>
      </div>
    );
  }

  if (loggedIn === false) {
    return (
      <p className="font-body text-sm text-muted">
        Please <a href="/login" className="text-accent">log in</a> to complete your order.
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <p className="font-body text-sm text-muted">
        Your bag is empty. <a href="/shop" className="text-accent">Continue shopping →</a>
      </p>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <h2 className="font-label text-xs tracking-widest uppercase mb-4">ORDER SUMMARY</h2>
        <div className="space-y-3">
          {cart.items.map((item) => {
            const p = productBySlug.get(item.productSlug);
            return (
              <div key={item.id} className="flex justify-between font-body text-sm">
                <span>{p?.name ?? "…"} × {item.quantity}</span>
                <span>{(parsePrice(p?.price) * item.quantity).toFixed(2)} JOD</span>
              </div>
            );
          })}
          <div className="h-px bg-ink/10 my-2" />
          <div className="flex justify-between font-body text-sm text-muted"><span>Subtotal</span><span>{subtotal.toFixed(2)} JOD</span></div>
          <div className="flex justify-between font-body text-sm text-muted"><span>Shipping</span><span>{shipping.toFixed(2)} JOD</span></div>
          <div className="flex justify-between font-label text-base"><span>TOTAL</span><span>{total.toFixed(2)} JOD</span></div>
        </div>
      </section>

      <section>
        <h2 className="font-label text-xs tracking-widest uppercase mb-4">SHIPPING ADDRESS</h2>
        <div className="mb-4"><VerifyBanner /></div>
        <form action={placeOrderAction} className="grid gap-4">
          <div>
            <label className={labelCls} htmlFor="line1">ADDRESS LINE 1</label>
            <input id="line1" name="line1" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="line2">ADDRESS LINE 2 (OPTIONAL)</label>
            <input id="line2" name="line2" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="city">CITY</label>
            <input id="city" name="city" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="country">COUNTRY</label>
            <input id="country" name="country" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="postal">POSTAL CODE (OPTIONAL)</label>
            <input id="postal" name="postal" className={inputCls} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={`${btnCls} justify-self-start`}>
            {busy ? "PLACING…" : "PLACE ORDER →"}
          </button>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors. (`useCartProducts` returns objects with `slug`, `name`, `price`; confirm those property names match the hook — adjust if the hook uses different keys.)

- [ ] **Step 4: Commit**

```bash
git add app/checkout/page.tsx app/checkout/CheckoutClient.tsx
git commit -m "feat(checkout): add /checkout page with address form and summary"
```

---

### Task 14: Wire the cart CHECKOUT button to /checkout

**Files:**
- Modify: `components/cart/CartDrawer.tsx` (the CHECKOUT button, ~line 159-164)

- [ ] **Step 1: Import the router**

In `components/cart/CartDrawer.tsx`, add after the existing imports:
```tsx
import { useRouter } from "next/navigation";
```
Inside the `CartDrawer` component, after `const cart = useCart();`, add:
```tsx
  const router = useRouter();
```

- [ ] **Step 2: Make the button navigate**

Replace the CHECKOUT button (currently the `<button ...>CHECKOUT</button>` near line 159-164) with:
```tsx
            <button
              type="button"
              onClick={() => { cart.close(); router.push("/checkout"); }}
              className="w-full h-14 bg-[#0A0A0A] text-[#F7F7F4] font-label tracking-widest uppercase text-sm hover:bg-primary hover:text-[#0A0A0A] transition-all duration-300"
            >
              CHECKOUT
            </button>
```

- [ ] **Step 3: Verify build + manual check**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors. Then: add an item, open the cart, click CHECKOUT → drawer closes and `/checkout` loads with the summary.

- [ ] **Step 4: Commit**

```bash
git add components/cart/CartDrawer.tsx
git commit -m "feat(cart): wire CHECKOUT button to /checkout page"
```

---

### Task 15: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run:
```bash
npx vitest run
```
Expected: all tests pass (the previous ~29 plus the new strength-helper tests, the unverified-order test, and the 3 checkout tests).

- [ ] **Step 2: Typecheck the whole project**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Manual smoke test**

With the dev server on `http://localhost:3000`:
1. `/login` and `/signup` show the Google logo.
2. `/signup`: weak password → red bar + disabled button; strong → green + enabled.
3. Signing up routes to `/verify-email`; the email arrives; Resend has a cooldown.
4. Cart shows the orange verify banner while unverified; CHECKOUT opens `/checkout`.
5. Unverified user on `/checkout` → PLACE ORDER returns the verification message.
6. After clicking the email link (verified), placing an order shows the confirmation with an order number and the cart empties.
7. Logged-out user on `/checkout` → prompted to log in.

- [ ] **Step 4: Final confirmation**

Confirm `git status` is clean:
```bash
git status --short
```
Expected: clean (only the untracked `pics for the shop/` folder remains).

---

## Notes for the implementer
- Run commands from the repo root: `C:\Users\DELL\Desktop\eighty five eleven`.
- The DB must be up (`npm run db:up`) for the Vitest integration tests in Task 7 — they hit the real database.
- This repo requires `--legacy-peer-deps` for npm installs (zod peer conflict).
- Do not commit secrets; `.env.local` is gitignored.
