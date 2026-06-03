# Inquire About Product — Design

**Date:** 2026-06-03
**Status:** Approved, ready for implementation plan

## Purpose

Eighty Five Eleven sometimes drop-ships: when a customer wants a collectible
item the shop does not stock, the owner takes the request, collects an initial
deposit, and sources the item. This feature adds a public **"Inquire About
Product"** page where a customer describes the item they want and leaves their
contact details. On submit, the inquiry is saved to the database and an email is
sent to the shop owner, who then follows up to arrange the deposit offline.

**Out of scope (separate efforts, not built here):**
- Online deposit / payment collection — owner arranges payment offline.
- The full site redesign and AI-agent removal — tracked separately; this page
  is built on the existing design and stack.

## User flow

1. Customer opens `/inquire` (linked from the site nav).
2. Fills in the item they are looking for + their contact details.
3. Submits.
4. The inquiry is persisted to the database (`ProductInquiry`).
5. An email is sent to the shop owner with the inquiry details.
6. Customer sees a success confirmation. The owner contacts them to arrange the
   deposit.

## Data model

New Prisma model, mirroring the existing `ConsignmentSubmission` pattern in
`prisma/schema.prisma`:

```prisma
model ProductInquiry {
  id           Int      @id @default(autoincrement())
  userId       Int?
  user         User?    @relation(fields: [userId], references: [id])
  itemName     String   // e.g. "Travis Scott AJ1 Mocha" (required)
  category     String   // "shoe" | "hoodie" | "other"
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

Add the inverse relation to the existing `User` model:

```prisma
inquiries ProductInquiry[]
```

Requires one `prisma migrate dev` to create the table.

## Components

### `app/inquire/page.tsx`
Page shell (Server Component) rendering a Client Component form. Styled to match
the existing `app/contact` and consignment pages so it fits the current design.

Form fields:
- **Item / what are you looking for** — required free text (e.g. "Travis Scott AJ1 Mocha").
- **Category** — dropdown: Shoe / Hoodie / Other.
- **Size (EU)** — optional.
- **Budget** — optional number.
- **Notes** — optional free text.
- **Name** — required.
- **Email** — required.
- **Phone** — optional.

Behavior: client-side validation for required fields, submitting/disabled state,
explicit success and error states.

### `app/actions/inquiry.ts`
Server action `submitInquiry(input)`, mirroring `app/actions/consignment.ts`:
- Validate: `itemName`, `contactName`, `contactEmail` non-empty; basic email shape.
- `prisma.productInquiry.create(...)`.
- Send owner email via `lib/email.ts`.
- Return `{ ok: true, id }` or `{ ok: false, error }`.

Input type:
```ts
type SubmitInquiryInput = {
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
```

### `lib/email.ts`
Small Nodemailer helper.
- Reads SMTP credentials from env.
- Exports `sendOwnerEmail({ subject, html })` which sends to `OWNER_EMAIL`.
- Uses Gmail SMTP (host `smtp.gmail.com`, port 465 secure, or 587).

### Navigation
Add an "Inquire" link to the site header/nav alongside the existing pages.

## Error handling

**Email failure must not fail the request.** Order of operations in
`submitInquiry`: save to DB first, then attempt the email inside a try/catch. If
the email throws, log the error server-side and still return `{ ok: true }` to
the customer — the inquiry is already recorded and the owner can recover it from
the database. The customer should never see a failure for a successfully saved
inquiry.

Validation failures (missing required field, malformed email) return
`{ ok: false, error }` before any DB write.

## Configuration

New environment variables (added to `.env.local` and documented in
`.env.docker.example`):

```
SMTP_USER=omaraqel270@gmail.com
SMTP_PASS=<gmail app password>
OWNER_EMAIL=omaraqel270@gmail.com
```

The owner generates a Gmail **App Password** (Google Account → Security →
2-Step Verification → App passwords). This is documented; the user creates it.
`nodemailer` is added as a dependency.

## Testing

- **Unit:** `submitInquiry` validation — rejects empty `itemName` / `contactName`
  / `contactEmail` and malformed email, with Prisma and the email helper mocked.
  Confirms a valid input calls `productInquiry.create` and returns `{ ok: true }`.
- **Unit:** email failure path — when `sendOwnerEmail` throws, `submitInquiry`
  still returns `{ ok: true }`.
- **Manual:** submit the form locally → row appears in `db:studio` → formatted
  email arrives in the owner inbox.
