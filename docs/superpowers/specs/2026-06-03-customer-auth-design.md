# Customer Authentication — Design

**Date:** 2026-06-03
**Status:** Approved in principle, pending written-spec review

## Purpose

Eighty Five Eleven has no authentication today. This feature adds **customer
accounts** so shoppers can sign up, log in (email/password or Google), and reset
forgotten passwords. Logging in is then **required to place an order** — the cart
checkout is gated. When an order is placed, the shop owner is emailed (reusing
the existing `lib/email.ts` helper built for product inquiries).

Identity is handled by **Firebase Authentication** (project
`eighty-five-eleven-707eb`). The existing MSSQL `User` table is kept for profile
and order data, linked to the Firebase user by a new `firebaseUid` field.

**Out of scope (separate future efforts, explicitly not built here):**
- A **My Account / order history** page (login works; what it unlocks beyond
  checkout comes later).
- The **owner admin platform** (a separate piece of software where the owner
  adds/edits/deletes products, reflected on the main site). Tracked separately.
- Roles / owner-only areas. Customers only.

## Firebase setup (already completed)

- Firebase project `eighty-five-eleven-707eb` created; web app registered.
- Email/Password and Google sign-in providers enabled in the console.
- Public web config in `.env.local` as `NEXT_PUBLIC_FIREBASE_*`.
- Admin service-account credentials in `.env.local` as `FIREBASE_ADMIN_*`
  (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
  `FIREBASE_ADMIN_PRIVATE_KEY`).

## Pages (3)

| Page | Route | Contents |
|------|-------|----------|
| Log In | `/login` | Email + password fields, "Continue with Google" button, "Forgot password?" link, link to Sign Up |
| Sign Up | `/signup` | Name, email, password, confirm password, "Sign up with Google" button, link to Log In |
| Forgot Password | `/forgot-password` | Single email field → triggers Firebase password-reset email |

No custom "reset password" page — Firebase hosts the reset screen the emailed
link opens. A "My Account" page is future scope.

## Architecture & data flow

### Identity vs. profile
- **Firebase** owns identity: email, password, Google sign-in, password reset.
- **MSSQL `User`** owns profile + relations (orders, cart, addresses, etc.).
- Link: add `firebaseUid String? @unique` to `User`. The existing
  `passwordHash` field is removed (Firebase holds the password). Requires one
  `prisma migrate dev`.

### Client auth (browser)
- `lib/firebase/client.ts` — initializes the Firebase web SDK from the
  `NEXT_PUBLIC_FIREBASE_*` env vars; exports the `Auth` instance.
- The login/signup forms call Firebase client SDK methods
  (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`,
  `signInWithPopup` for Google, `sendPasswordResetEmail`).
- After a successful client login, the client retrieves the Firebase **ID
  token** and POSTs it to a session endpoint (below) to establish a server
  session.

### Server session (the gating mechanism)
- `lib/firebase/admin.ts` — initializes the Firebase Admin SDK from the
  `FIREBASE_ADMIN_*` env vars (normalizing `\n` in the private key). Exports
  `adminAuth`.
- `app/api/auth/session/route.ts`:
  - `POST` — receives `{ idToken }`, verifies it with
    `adminAuth.verifyIdToken`, creates a **session cookie** with
    `adminAuth.createSessionCookie`, sets it as an httpOnly cookie. Also
    **upserts** the MSSQL `User` row (by `firebaseUid`, storing email/name).
  - `DELETE` — clears the session cookie (logout).
- `lib/auth/session.ts` — `getCurrentUser()`: reads the session cookie,
  verifies it with `adminAuth.verifySessionCookie`, returns the matching MSSQL
  `User` (or `null`). Used by server actions and pages to know who is logged in.

### Checkout gating + owner email
- The existing `placeOrder` server action gains a guard: call
  `getCurrentUser()`; if `null`, return `{ ok: false, error: "auth required" }`
  before creating the order. The order is associated with that user.
- On successful order creation, send the owner an email via `sendOwnerEmail`
  (subject + order summary), inside a try/catch so email failure never fails the
  order (same pattern as the inquiry feature).

### Header
- `components/layout/Header.tsx` shows **"Log in"** when logged out, and the
  user's name + **"Log out"** when logged in (reads auth state on the client).

## Error handling

- **Auth errors** (wrong password, email already in use, popup closed, etc.):
  the forms map common Firebase error codes to friendly messages and show an
  inline error; no crash.
- **Session verification failure** (expired/invalid cookie): `getCurrentUser()`
  returns `null`; gated actions reject with "auth required"; the UI redirects to
  `/login`.
- **Owner email failure on order:** logged server-side, order still succeeds.
- **Google popup blocked / closed:** caught, friendly inline message.

## Configuration (env vars, already present in `.env.local`)

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=eighty-five-eleven-707eb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_ADMIN_PROJECT_ID=eighty-five-eleven-707eb
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="..."
```
`.env.docker.example` is updated with the same keys (blank values).
New dependencies: `firebase` (client SDK) and `firebase-admin` (server SDK).

## Testing

- **Unit:** `getCurrentUser()` returns `null` when no cookie / invalid cookie,
  and the `User` when the session cookie verifies — with `adminAuth` mocked.
- **Unit:** `placeOrder` rejects with "auth required" when `getCurrentUser()`
  returns `null`, and proceeds when it returns a user — with Prisma + email
  mocked.
- **Manual:** sign up (email) → log out → log in → Google sign-in → forgot
  password (reset email arrives) → add to cart → checkout blocked when logged
  out, succeeds when logged in → owner receives order email → `User` row exists
  with `firebaseUid`.
