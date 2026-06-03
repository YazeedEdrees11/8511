# Inquire About Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/inquire` page where customers request a collectible item the shop doesn't stock; each submission is saved to the database and emailed to the shop owner.

**Architecture:** A new `ProductInquiry` Prisma model stores submissions. A server action `submitInquiry` validates input, writes the row, then sends an owner email via a Nodemailer helper (`lib/email.ts`) that no-ops when SMTP creds are absent and never fails the request. A client form page at `app/inquire/page.tsx` collects input. The header nav gets an "INQUIRE" link.

**Tech Stack:** Next.js 15 (App Router, server actions), Prisma + MSSQL, Nodemailer (Gmail SMTP), Tailwind v4, Vitest (integration tests against local DB).

---

## File Structure

- `prisma/schema.prisma` — add `ProductInquiry` model + `User.inquiries` relation (Modify)
- `lib/email.ts` — Nodemailer owner-email helper, no-op without creds (Create)
- `app/actions/inquiry.ts` — `submitInquiry` server action (Create)
- `app/inquire/page.tsx` — page shell (Server Component) (Create)
- `app/inquire/InquiryForm.tsx` — client form (Create)
- `components/layout/Header.tsx` — add nav link (Modify)
- `.env.docker.example` — document SMTP vars (Modify)
- `tests/actions/inquiry.test.ts` — integration test (Create)

**Prerequisites (run once, by the user, before Task 1):**
- Add to `.env.local` (gitignored — never commit): `SMTP_USER=`, `SMTP_PASS=`, `OWNER_EMAIL=` (values from the Gmail App Password).
- MSSQL running: `docker compose up -d mssql`.

---

### Task 1: Add the `ProductInquiry` model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the model** at the end of `prisma/schema.prisma` (after `ConsignmentSubmission`):

```prisma
model ProductInquiry {
  id           Int      @id @default(autoincrement())
  userId       Int?
  user         User?    @relation(fields: [userId], references: [id])
  itemName     String
  category     String
  sizeEu       String?
  budget       Decimal? @db.Decimal(10, 2)
  notes        String?  @db.NVarChar(Max)
  contactName  String
  contactEmail String
  contactPhone String?
  status       String   @default("new")
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 2: Add the inverse relation** to the existing `User` model. Find the `User` model and add this line alongside `consignments` / `bookings`:

```prisma
  inquiries    ProductInquiry[]
```

- [ ] **Step 3: Create and apply the migration**

Run: `npm run db:migrate -- --name add_product_inquiry`
Expected: migration created under `prisma/migrations/`, applied to local DB, Prisma Client regenerated. Output ends with "Your database is now in sync with your schema."

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add ProductInquiry model"
```

---

### Task 2: Email helper (`lib/email.ts`)

**Files:**
- Create: `lib/email.ts`

- [ ] **Step 1: Add the nodemailer dependency**

Run: `npm install nodemailer && npm install -D @types/nodemailer`
Expected: both packages added to `package.json`. (If ERESOLVE appears, append `--legacy-peer-deps`.)

- [ ] **Step 2: Write the helper**

```typescript
import nodemailer from "nodemailer";

export type OwnerEmail = { subject: string; html: string };

// Sends an email to the shop owner. No-ops (logs) when SMTP is not configured,
// so it is safe in tests/dev and never throws to the caller.
export async function sendOwnerEmail({ subject, html }: OwnerEmail): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.OWNER_EMAIL ?? user;

  if (!user || !pass || !to) {
    console.warn("[email] SMTP not configured — skipping send:", subject);
    return;
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transport.sendMail({ from: user, to, subject, html });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from `lib/email.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/email.ts package.json package-lock.json
git commit -m "feat(email): add nodemailer owner-email helper"
```

---

### Task 3: `submitInquiry` server action (TDD)

**Files:**
- Create: `app/actions/inquiry.ts`
- Test: `tests/actions/inquiry.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/actions/inquiry.test.ts`)

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { submitInquiry } from "@/app/actions/inquiry";

describe("submitInquiry", () => {
  afterAll(() => prisma.$disconnect());

  it("creates an inquiry with status 'new'", async () => {
    const r = await submitInquiry({
      itemName: "Travis Scott AJ1 Mocha",
      category: "shoe",
      sizeEu: "42",
      budget: "300.00",
      notes: "DS only",
      contactName: "Omar",
      contactEmail: "buyer@example.com",
      contactPhone: "0790000000",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    const row = await prisma.productInquiry.findUniqueOrThrow({ where: { id: r.id } });
    expect(row.status).toBe("new");
    expect(row.itemName).toBe("Travis Scott AJ1 Mocha");
    await prisma.productInquiry.delete({ where: { id: r.id } });
  });

  it("rejects missing required fields", async () => {
    const r = await submitInquiry({
      itemName: "", category: "shoe", contactName: "Omar", contactEmail: "buyer@example.com",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects a malformed email", async () => {
    const r = await submitInquiry({
      itemName: "Some Hoodie", category: "other", contactName: "Omar", contactEmail: "not-an-email",
    });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test — verify it fails**

Run: `npm test -- tests/actions/inquiry.test.ts`
Expected: FAIL — cannot resolve `@/app/actions/inquiry`.

- [ ] **Step 3: Write the implementation** (`app/actions/inquiry.ts`)

```typescript
"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { sendOwnerEmail } from "@/lib/email";

export type SubmitInquiryInput = {
  userId?: number;
  itemName: string;
  category: string;
  sizeEu?: string;
  budget?: string;
  notes?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
};

export type SubmitInquiryResult = { ok: true; id: number } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitInquiry(input: SubmitInquiryInput): Promise<SubmitInquiryResult> {
  if (!input.itemName.trim())     return { ok: false, error: "itemName required" };
  if (!input.contactName.trim())  return { ok: false, error: "contactName required" };
  if (!EMAIL_RE.test(input.contactEmail.trim())) return { ok: false, error: "valid email required" };

  const row = await prisma.productInquiry.create({
    data: {
      userId: input.userId,
      itemName: input.itemName.trim(),
      category: input.category || "other",
      sizeEu: input.sizeEu,
      budget: input.budget ? new Prisma.Decimal(input.budget) : null,
      notes: input.notes,
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim(),
      contactPhone: input.contactPhone,
    },
  });

  // Email failure must NOT fail the request — the inquiry is already saved.
  try {
    await sendOwnerEmail({
      subject: `New product inquiry: ${row.itemName}`,
      html: `
        <h2>New product inquiry</h2>
        <p><b>Item:</b> ${row.itemName}</p>
        <p><b>Category:</b> ${row.category}</p>
        <p><b>Size (EU):</b> ${row.sizeEu ?? "—"}</p>
        <p><b>Budget:</b> ${row.budget ?? "—"}</p>
        <p><b>Notes:</b> ${row.notes ?? "—"}</p>
        <hr>
        <p><b>Name:</b> ${row.contactName}</p>
        <p><b>Email:</b> ${row.contactEmail}</p>
        <p><b>Phone:</b> ${row.contactPhone ?? "—"}</p>
      `,
    });
  } catch (err) {
    console.error("[inquiry] owner email failed (inquiry still saved):", err);
  }

  return { ok: true, id: row.id };
}
```

- [ ] **Step 4: Run the test — verify it passes**

Run: `npm test -- tests/actions/inquiry.test.ts`
Expected: PASS (3 tests). The email helper no-ops because SMTP creds are absent in the test env.

- [ ] **Step 5: Commit**

```bash
git add app/actions/inquiry.ts tests/actions/inquiry.test.ts
git commit -m "feat(actions): add submitInquiry server action"
```

---

### Task 4: Inquiry form page

**Files:**
- Create: `app/inquire/page.tsx`
- Create: `app/inquire/InquiryForm.tsx`

- [ ] **Step 1: Write the page shell** (`app/inquire/page.tsx`)

```tsx
import InquiryForm from "./InquiryForm";

export default function Inquire() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">INQUIRE</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">
        CAN&apos;T FIND IT?
      </h1>
      <p className="mt-6 max-w-2xl text-base text-ink/80 leading-relaxed">
        Looking for a grail we don&apos;t have in stock? Tell us what you want and
        we&apos;ll source it. Leave your details and we&apos;ll reach out to arrange it.
      </p>
      <div className="mt-12 max-w-2xl">
        <InquiryForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the client form** (`app/inquire/InquiryForm.tsx`)

```tsx
"use client";
import { useState } from "react";
import { submitInquiry } from "@/app/actions/inquiry";

const inputCls =
  "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";

export default function InquiryForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function action(formData: FormData) {
    setState("sending");
    setError("");
    const r = await submitInquiry({
      itemName: String(formData.get("itemName") ?? ""),
      category: String(formData.get("category") ?? "other"),
      sizeEu: String(formData.get("sizeEu") ?? "") || undefined,
      budget: String(formData.get("budget") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
      contactName: String(formData.get("contactName") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? "") || undefined,
    });
    if (r.ok) setState("done");
    else { setState("error"); setError(r.error); }
  }

  if (state === "done") {
    return (
      <div className="border border-ink/15 p-8">
        <p className="font-display text-3xl">THANK YOU.</p>
        <p className="mt-3 text-base text-ink/80">
          We got your request and we&apos;ll be in touch soon to arrange it.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-6">
      <div>
        <label className={labelCls} htmlFor="itemName">WHAT ARE YOU LOOKING FOR? *</label>
        <input id="itemName" name="itemName" required placeholder="e.g. Travis Scott AJ1 Mocha" className={inputCls} />
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        <div>
          <label className={labelCls} htmlFor="category">CATEGORY</label>
          <select id="category" name="category" className={inputCls} defaultValue="shoe">
            <option value="shoe">Shoe</option>
            <option value="hoodie">Hoodie</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="sizeEu">SIZE (EU)</label>
          <input id="sizeEu" name="sizeEu" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="budget">BUDGET</label>
          <input id="budget" name="budget" type="number" step="0.01" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="notes">NOTES</label>
        <textarea id="notes" name="notes" rows={3} className={inputCls} />
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        <div>
          <label className={labelCls} htmlFor="contactName">NAME *</label>
          <input id="contactName" name="contactName" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="contactEmail">EMAIL *</label>
          <input id="contactEmail" name="contactEmail" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="contactPhone">PHONE</label>
          <input id="contactPhone" name="contactPhone" className={inputCls} />
        </div>
      </div>
      {state === "error" && <p className="text-sm text-red-600">{error || "Something went wrong."}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="justify-self-start bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50"
      >
        {state === "sending" ? "SENDING…" : "SEND INQUIRY →"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Verify the page renders**

Run: `npm run dev`, open `http://localhost:3000/inquire`.
Expected: page loads, form shows all fields, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/inquire/page.tsx app/inquire/InquiryForm.tsx
git commit -m "feat(inquire): add inquiry form page"
```

---

### Task 5: Nav link + env documentation

**Files:**
- Modify: `components/layout/Header.tsx:6-12`
- Modify: `.env.docker.example`

- [ ] **Step 1: Add the nav link.** In `components/layout/Header.tsx`, add to the `NAV` array (after the `/contact` entry):

```typescript
  { href: "/inquire", label: "INQUIRE" },
```

- [ ] **Step 2: Document SMTP vars.** Append to `.env.docker.example`:

```
# Owner inquiry email (Gmail SMTP via app password)
SMTP_USER=
SMTP_PASS=
OWNER_EMAIL=
```

- [ ] **Step 3: Verify** the "INQUIRE" link appears in the header and routes to `/inquire`.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Header.tsx .env.docker.example
git commit -m "feat(inquire): add nav link and document SMTP env vars"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including `tests/actions/inquiry.test.ts`.

- [ ] **Step 2: Manual submit with email.** Ensure `.env.local` has real `SMTP_USER`/`SMTP_PASS`/`OWNER_EMAIL`. Submit the form at `/inquire`.
Expected: success message shown; a row appears in `npm run db:studio` under `ProductInquiry`; a formatted email arrives at `OWNER_EMAIL`.

- [ ] **Step 3: Manual submit without email creds.** Temporarily blank `SMTP_USER` in `.env.local`, restart dev, submit again.
Expected: success message still shown; row still saved; server log prints `[email] SMTP not configured — skipping send`. Confirms email failure never blocks a save.
