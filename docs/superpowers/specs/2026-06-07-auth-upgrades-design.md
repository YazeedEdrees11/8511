# Auth Upgrades — Design Spec

**Date:** 2026-06-07
**Branch:** `feat/verification-3d-model`
**Status:** Approved (design), pending spec review

## Goal

Three crucial upgrades to the existing Firebase-based customer authentication:

1. Add the official Google logo to the "Continue/Sign up with Google" buttons.
2. Email verification (link-based) for email/password signups, gating checkout.
3. A password-strength bar on signup that goes from weak → strong with color feedback, and blocks weak passwords.

The site uses **Firebase Auth** (client `firebase` SDK + `firebase-admin`), with session cookies and a Prisma `User` table keyed by `firebaseUid`. No new auth library is introduced — all three features build on the existing Firebase setup.

### Why not `better-auth/skills`?

Those skills target the **Better Auth** library, not Firebase. Adopting them would require ripping out the existing Firebase auth (signup, login, Google, session cookies, `firebaseUid` schema) and rewriting from scratch, for no functional gain. Firebase already provides email verification and Google sign-in. We keep Firebase and implement the same good concepts (verification gating, token expiry) the Firebase way.

---

## Feature 1 — Google logo on auth buttons

### What
Show the official 4-color Google "G" mark, left of the button label, on both Google buttons.

### Where
- `app/login/LoginForm.tsx` — "CONTINUE WITH GOOGLE"
- `app/signup/SignupForm.tsx` — "SIGN UP WITH GOOGLE"

### How
- New shared component `components/icons/GoogleIcon.tsx` — an inline SVG of the official Google "G" (4-color), accepting an optional `className` for sizing (default ~18px square).
- Both buttons become `flex items-center justify-center gap-3` with the icon before the text.
- No new dependency.

### Acceptance
- Both buttons render the colored Google "G" to the left of the text.
- Buttons remain keyboard-focusable and disabled while `busy`.

---

## Feature 2 — Email verification (link) + checkout gate

### Decisions
- **Mechanism:** Firebase native verification **link** (`sendEmailVerification`), not OTP.
- **Gating:** Block **checkout only**. Unverified users may browse and add to cart; they cannot place an order.
- **Google users:** auto-verified by Google (`emailVerified === true`); they bypass the gate entirely.

### Flow
1. On email/password signup (`SignupForm`), after `createUserWithEmailAndPassword` + `updateProfile`:
   - Call `sendEmailVerification(cred.user)`.
   - Establish the session (`postSession`) so the user is logged in and can browse/cart.
   - Redirect to **`/verify-email`** instead of `/`.
2. **`/verify-email`** page (new, client component):
   - Message: "We've sent a verification link to your email. Click it to verify your account."
   - **Resend** button → calls `sendEmailVerification(auth.currentUser)` with a cooldown (disabled ~30s after sending) and a "sent!" confirmation.
   - A "Continue browsing" link to `/`.
   - If `auth.currentUser?.emailVerified` is already true, show a "verified ✓" state instead.
3. **The gate** lives in `app/actions/orders.ts` (`placeOrder`):
   - After `getCurrentUser()`, read the user's **fresh** verification status via the Admin SDK: `adminAuth.getUser(uid).emailVerified`. (Fresh read avoids trusting the stale session-cookie claim, which is captured at login before the user clicks the link.)
   - If not verified → reject with a clear error: `"Please verify your email before placing an order. Check your inbox for the verification link."`
   - If verified (incl. Google users) → proceed as today.

### Supporting changes
- `lib/auth/session.ts`: add a helper that returns verification status, e.g. `getCurrentUserWithVerification(): Promise<{ user: User; emailVerified: boolean } | null>` which does the `adminAuth.getUser` fresh read. `placeOrder` uses this. Existing `getCurrentUser()` stays for callers that don't need verification.
- A subtle reminder banner at checkout (in the cart drawer or order step) shown only when the logged-in user is unverified, linking to `/verify-email`. (Scope-limited: a single conditional banner, not a global layout change.)

### Edge cases
- Resend spam: client-side cooldown (~30s) on the Resend button; Firebase also rate-limits server-side.
- User verifies in another tab: the `/verify-email` page can re-check on focus (`auth.currentUser.reload()`), but a manual refresh is acceptable for v1.
- `auth.currentUser` null on `/verify-email` (e.g. session expired): show a prompt to log in again.

### Acceptance
- New email/password signup triggers a verification email and lands on `/verify-email`.
- Resend works and is rate-limited on the client.
- Placing an order while unverified is rejected with the clear message.
- After clicking the link, placing an order succeeds.
- Google sign-ups can order immediately (auto-verified).

---

## Feature 3 — Password strength bar

### Decisions
- Library: **`@zxcvbn-ts/core`** (modern, tree-shakeable zxcvbn) + `@zxcvbn-ts/language-common` (and `language-en` for dictionary/translations), **lazy-loaded** in the client component so it doesn't bloat initial JS.
- Enforce a **minimum score of 2 ("Fair")** to allow signup submit. Firebase's existing `minLength={6}` stays.

### How
- New `components/auth/PasswordStrengthBar.tsx` (client):
  - Props: `password: string`.
  - Lazy-loads zxcvbn-ts on first input; computes `result.score` (0–4).
  - Renders a 4-segment bar; filled segments and color reflect score:
    - 0–1 → **red** ("Weak")
    - 2 → **orange** ("Fair")
    - 3 → **yellow/lime** ("Good")
    - 4 → **green** ("Strong")
  - Shows the label and the top suggestion from `result.feedback` (e.g. "Add another word or two") when present.
  - Empty password → no bar / neutral state.
- A small pure helper (testable) maps score → `{ label, colorClass, segments }`. This is what unit tests target (no need to test zxcvbn itself).
- Wire into `SignupForm.tsx`:
  - Convert the password input to controlled state (`password`, `setPassword`).
  - Render `<PasswordStrengthBar password={password} />` directly below the password field.
  - Block submit (disable button + guard in `signup()`) until score ≥ 2, with a message like "Choose a stronger password."

### Acceptance
- Typing a weak password shows a red "Weak" bar; strengthening it moves through orange/yellow to green "Strong".
- A helpful tip appears for weak/fair passwords.
- Submit is blocked until at least "Fair".

---

---

## Feature 4 — Full checkout page (wire the dead CHECKOUT button)

### Context
The cart drawer's `CHECKOUT` button is currently a placeholder that does nothing, and `placeOrder` is never called from the UI. Without this, the verification gate can't actually fire for a customer. This feature makes checkout real.

### Flow
1. Cart drawer `CHECKOUT` button → closes drawer and routes to **`/checkout`**.
2. **`/checkout`** page (client):
   - Reads cart items via `useCart()` and product details (name/price/image) via `useCartProducts()` — same pricing as the drawer (subtotal + 10 JOD shipping).
   - Shows an order summary and a **shipping address form**: `line1`, `line2` (optional), `city`, `country`, `postal` (optional). (Customer name/email come from the account.)
   - Shows the verify reminder banner when the user is unverified.
   - **PLACE ORDER** submits to a new `checkout` server action.
   - States: not logged in → prompt to log in; empty cart → message + link to shop; success → confirmation with the order number; error → inline message (incl. the verification message).
3. **`checkout` server action** (in `app/actions/orders.ts`):
   - `getCurrentUserWithVerification()` → reject `auth required` if null, verification message if unverified, `no items` if empty.
   - Creates an `Address` row for the user from the submitted fields.
   - Delegates to the existing `placeOrder({ addressId, items })` (which re-checks auth/verification — defense in depth — and sends the owner email).
   - On success, clears the server cart by `cart_sid` cookie (best-effort, wrapped in try/catch so a cookie-read failure never fails a placed order).
   - Returns the same `PlaceOrderResult` shape.
4. After success the page calls `cart.refresh()` so the header badge and drawer empty.

### Supporting changes
- `CartProvider`: expose the existing internal `refresh` on the context (`CartState.refresh: () => Promise<void>`).
- `CartDrawer`: `CHECKOUT` button uses `useRouter().push("/checkout")` and `cart.close()`.

### Acceptance
- Clicking CHECKOUT opens `/checkout` with the correct summary.
- A verified, logged-in user can fill the address, place the order, see a confirmation with order number, and the cart empties.
- An unverified user sees the block message and cannot place the order.
- A logged-out user is prompted to log in.

---

## Testing

- **Unit:** strength helper — score 0/1 → Weak/red, 2 → Fair/orange, 3 → Good/yellow, 4 → Strong/green; segment counts correct.
- **Integration (`placeOrder`):** with `getCurrentUserWithVerification` mocked —
  - unverified email user → rejected with the verification message;
  - verified user → order succeeds;
  - Google user (emailVerified true) → order succeeds.
- **Integration (`checkout`):** with `getCurrentUserWithVerification` and `next/headers` mocked —
  - verified user → creates an address + order, returns order number;
  - unverified user → rejected with the verification message;
  - not logged in → `auth required`.
- **Regression:** existing 29 tests still pass.

## Files

**New**
- `components/icons/GoogleIcon.tsx`
- `components/auth/PasswordStrengthBar.tsx`
- `components/auth/VerifyBanner.tsx`
- `lib/auth/passwordStrength.ts`
- `app/verify-email/page.tsx` + `app/verify-email/VerifyEmailClient.tsx`
- `app/checkout/page.tsx` + `app/checkout/CheckoutClient.tsx`
- tests for the strength helper, the `placeOrder` gate, and the `checkout` action

**Edited**
- `app/login/LoginForm.tsx` — Google icon
- `app/signup/SignupForm.tsx` — Google icon, controlled password, strength bar, send verification, redirect to `/verify-email`, block weak submit
- `lib/auth/session.ts` — `getCurrentUserWithVerification` helper
- `app/actions/orders.ts` — verification gate + `checkout` action
- `components/cart/CartDrawer.tsx` — unverified reminder banner + working CHECKOUT button
- `components/cart/CartProvider.tsx` — expose `refresh` on context

**Dependencies**
- `@zxcvbn-ts/core`, `@zxcvbn-ts/language-common`, `@zxcvbn-ts/language-en` (install with `--legacy-peer-deps`, consistent with this repo)

## Out of scope
- OTP codes (chose link instead).
- Blocking login entirely (chose checkout-only gate).
- Phone/SMS verification.
- The 3D landing-page shoe (separate task on this branch).
