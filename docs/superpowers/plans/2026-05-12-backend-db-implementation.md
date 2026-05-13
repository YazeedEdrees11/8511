# 8511 Backend DB Reshape — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the JSON-file data layer with Microsoft SQL Server (Dockerized) accessed via Prisma. Land a full commerce schema, seed it with mock data, swap the catalog reads, and stub the six new write endpoints.

**Architecture:** SQL Server 2022 runs in Docker via `docker-compose` with a persistent volume. Prisma owns the schema and migrations. `lib/db.ts` exposes a singleton client; `lib/catalog.ts` is rewritten to be Prisma-backed but keeps its export surface. Pages stay server-rendered and call catalog functions directly; browser-driven actions (cart, checkout, forms) go through route handlers or server actions.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma 5+, `@prisma/client`, Microsoft SQL Server 2022, Docker Compose, vitest.

**Spec:** `docs/superpowers/specs/2026-05-12-backend-db-design.md`

---

## File Structure

**New files:**
- `docker-compose.yml` — DB container definition
- `.env.docker` — DB-side env (gitignored)
- `.env.example` — committed template for both env files
- `prisma/schema.prisma` — Prisma datasource + all models
- `prisma/migrations/**` — generated migration SQL
- `lib/db.ts` — Prisma client singleton
- `scripts/seed.ts` — idempotent seed script
- `app/api/cart/route.ts` — `GET`, `POST` cart endpoints
- `app/api/cart/[id]/route.ts` — `DELETE` cart item
- `app/actions/orders.ts` — `placeOrder` server action
- `app/actions/consignment.ts` — `submitConsignment` server action
- `app/actions/bookings.ts` — `bookService` server action
- `tests/lib/catalog.test.ts` — rewritten (replaces existing)
- `tests/actions/orders.test.ts`, `tests/actions/consignment.test.ts`, `tests/actions/bookings.test.ts`
- `tests/api/cart.test.ts`

**Modified:**
- `package.json` — new scripts and deps
- `.gitignore` — add `.env.local`, `.env.docker`, `prisma/dev.db*` (defensive)
- `lib/catalog.ts` — Prisma-backed, keeps `loadKB`
- `app/page.tsx`, `app/shop/page.tsx`, `app/shop/[brand]/page.tsx`, `app/product/[slug]/page.tsx` — add `await`, switch `p.brand` → `p.brand.slug`
- `app/api/products/route.ts` — async, flattens shape for the chat widget
- `components/chat/ProductCard.tsx` — adapt to new product shape
- `README.md` — daily dev workflow

**Removed (later, after stabilization):** none in this plan. `data/products.json` stays as the seed's input.

---

## Conventions

- Commit after each task. Conventional Commits prefixes (`feat`, `chore`, `refactor`, `test`, `docs`).
- All paths below are relative to repo root `C:/Users/DELL/Desktop/eighty five eleven`.
- Run commands from repo root unless noted.
- This is Windows + PowerShell. `npm` and `docker compose` work from either PowerShell or Git Bash.

---

## Task 1: Docker Compose & env scaffolding

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.docker` (gitignored)
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Add `.gitignore` entries**

Append to `.gitignore`:

```
# Local env
.env.local
.env.docker

# Prisma (defensive)
prisma/dev.db*
```

- [ ] **Step 2: Create `.env.example`**

Create `.env.example`:

```
# === .env.docker (gitignored) — used by docker-compose ===
MSSQL_SA_PASSWORD=ChangeMe_Str0ng!Passw0rd

# === .env.local (gitignored) — used by Next.js / Prisma ===
DATABASE_URL="sqlserver://localhost:1433;database=eighty_five_eleven;user=sa;password=ChangeMe_Str0ng!Passw0rd;trustServerCertificate=true"
```

- [ ] **Step 3: Create `.env.docker` (local only, not committed)**

```
MSSQL_SA_PASSWORD=ChangeMe_Str0ng!Passw0rd
```

- [ ] **Step 4: Create `.env.local` (local only, not committed)**

```
DATABASE_URL="sqlserver://localhost:1433;database=eighty_five_eleven;user=sa;password=ChangeMe_Str0ng!Passw0rd;trustServerCertificate=true"
```

- [ ] **Step 5: Create `docker-compose.yml`**

```yaml
services:
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: eighty-five-eleven-mssql
    env_file:
      - .env.docker
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_PID: Developer
    ports:
      - "1433:1433"
    volumes:
      - mssql-data:/var/opt/mssql
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"$$MSSQL_SA_PASSWORD\" -C -Q 'SELECT 1' || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

volumes:
  mssql-data:
```

- [ ] **Step 6: Add scripts to `package.json`**

In `package.json` under `"scripts"`, add (alongside existing entries):

```json
"db:up": "docker compose up -d",
"db:down": "docker compose down",
"db:migrate": "prisma migrate dev",
"db:seed": "tsx scripts/seed.ts",
"db:studio": "prisma studio",
"db:reset": "prisma migrate reset"
```

- [ ] **Step 7: Verify DB starts and is reachable**

Run: `npm run db:up`
Expected: container `eighty-five-eleven-mssql` reaches `healthy` state. Confirm via:
`docker ps --format "{{.Names}}\t{{.Status}}"`
Expected line contains: `eighty-five-eleven-mssql ... (healthy)` within ~60s.

If it stays unhealthy, run `docker logs eighty-five-eleven-mssql` and check the SA password meets SQL Server's complexity rules (≥8 chars, upper+lower+digit+symbol).

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml .env.example .gitignore package.json
git commit -m "chore: add dockerized mssql for local development"
```

---

## Task 2: Install Prisma and initialize

**Files:**
- Modify: `package.json` (deps)
- Create: `prisma/schema.prisma` (initial stub from `prisma init`)

- [ ] **Step 1: Install Prisma**

Run: `npm i -D prisma`
Run: `npm i @prisma/client`

- [ ] **Step 2: Initialize Prisma with SQL Server provider**

Run: `npx prisma init --datasource-provider sqlserver`
Expected: creates `prisma/schema.prisma` and appends `DATABASE_URL` placeholder to `.env`. **Delete the `.env` file** if `prisma init` created one — we use `.env.local` (Next.js reads it, and Prisma CLI also reads `.env.local` when invoked via `npm run`).

Run: `if (Test-Path .env) { Remove-Item .env }` (PowerShell)
or: `rm -f .env` (bash)

Confirm Prisma picks up `.env.local`: `npx prisma validate`
Expected: `The schema at prisma\schema.prisma is valid.`

If Prisma complains it can't find `DATABASE_URL`, prepend the script in `package.json` with `dotenv-cli`. **Fallback:** keep `.env` containing only `DATABASE_URL` (same value as `.env.local`), and add `.env` to `.gitignore`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma .gitignore
git commit -m "chore: install prisma and init sqlserver datasource"
```

---

## Task 3: Define full Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace `prisma/schema.prisma` with the full schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

// ---------- Catalog ----------

model Brand {
  id        Int       @id @default(autoincrement())
  slug      String    @unique
  name      String
  products  Product[]
}

model Product {
  id           Int              @id @default(autoincrement())
  slug         String           @unique
  name         String
  brandId      Int
  brand        Brand            @relation(fields: [brandId], references: [id])
  description  String           @db.NVarChar(Max)
  imageUrl     String
  sourceUrl    String
  basePrice    Decimal?         @db.Decimal(10, 2)
  releaseDate  DateTime?
  createdAt    DateTime         @default(now())
  variants     ProductVariant[]
  images       ProductImage[]
  orderItems   OrderItem[]
  cartItems    CartItem[]
}

model ProductImage {
  id         Int     @id @default(autoincrement())
  productId  Int
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url        String
  sortOrder  Int     @default(0)
}

model ProductVariant {
  id         Int          @id @default(autoincrement())
  productId  Int
  product    Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  sizeEu     String
  sku        String       @unique
  price      Decimal?     @db.Decimal(10, 2)
  stock      Int          @default(0)
  cartItems  CartItem[]
  orderItems OrderItem[]

  @@unique([productId, sizeEu])
}

// ---------- Users & addresses ----------

model User {
  id            Int                     @id @default(autoincrement())
  email         String                  @unique
  passwordHash  String?
  name          String?
  phone         String?
  createdAt     DateTime                @default(now())
  addresses     Address[]
  carts         Cart[]
  orders        Order[]
  consignments  ConsignmentSubmission[]
  bookings      ServiceBooking[]
}

model Address {
  id        Int     @id @default(autoincrement())
  userId    Int
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  line1     String
  line2     String?
  city      String
  country   String
  postal    String?
  isDefault Boolean @default(false)
  orders    Order[]
}

// ---------- Cart & orders ----------

model Cart {
  id        Int        @id @default(autoincrement())
  userId    Int?
  user      User?      @relation(fields: [userId], references: [id])
  sessionId String?
  createdAt DateTime   @default(now())
  items     CartItem[]
}

model CartItem {
  id         Int             @id @default(autoincrement())
  cartId     Int
  cart       Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId  Int
  product    Product         @relation(fields: [productId], references: [id])
  variantId  Int?
  variant    ProductVariant? @relation(fields: [variantId], references: [id])
  quantity   Int             @default(1)
}

model Order {
  id          Int         @id @default(autoincrement())
  orderNumber String      @unique
  userId      Int
  user        User        @relation(fields: [userId], references: [id])
  addressId   Int
  address     Address     @relation(fields: [addressId], references: [id])
  status      String      @default("pending")
  subtotal    Decimal     @db.Decimal(10, 2)
  shipping    Decimal     @db.Decimal(10, 2)
  total       Decimal     @db.Decimal(10, 2)
  createdAt   DateTime    @default(now())
  items       OrderItem[]
}

model OrderItem {
  id         Int             @id @default(autoincrement())
  orderId    Int
  order      Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId  Int
  product    Product         @relation(fields: [productId], references: [id])
  variantId  Int?
  variant    ProductVariant? @relation(fields: [variantId], references: [id])
  sizeEu     String?
  unitPrice  Decimal         @db.Decimal(10, 2)
  quantity   Int
}

// ---------- Services ----------

model ServiceBooking {
  id           Int      @id @default(autoincrement())
  userId       Int?
  user         User?    @relation(fields: [userId], references: [id])
  serviceKey   String
  contactName  String
  contactEmail String
  contactPhone String?
  notes        String?  @db.NVarChar(Max)
  status       String   @default("new")
  createdAt    DateTime @default(now())
}

model ConsignmentSubmission {
  id            Int      @id @default(autoincrement())
  userId        Int?
  user          User?    @relation(fields: [userId], references: [id])
  productName   String
  brand         String
  sizeEu        String?
  conditionNote String?
  askingPrice   Decimal? @db.Decimal(10, 2)
  imageUrls     String   @db.NVarChar(Max)
  status        String   @default("submitted")
  createdAt     DateTime @default(now())
}
```

- [ ] **Step 2: Validate schema**

Run: `npx prisma validate`
Expected: `The schema at prisma\schema.prisma is valid.`

- [ ] **Step 3: Format schema**

Run: `npx prisma format`
Expected: re-formats file, no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): define full commerce schema in prisma"
```

---

## Task 4: Generate and apply initial migration

**Files:**
- Create: `prisma/migrations/<timestamp>_init/migration.sql` (generated)

- [ ] **Step 1: Ensure DB is up**

Run: `npm run db:up`
Wait until `docker ps` shows `(healthy)`.

- [ ] **Step 2: Create the `eighty_five_eleven` database**

`DATABASE_URL` targets a database named `eighty_five_eleven` which doesn't exist yet. Prisma's first migrate will fail on SQL Server unless the DB exists. Create it:

Run (PowerShell):
```powershell
docker exec -it eighty-five-eleven-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$env:MSSQL_SA_PASSWORD" -C -Q "CREATE DATABASE eighty_five_eleven"
```

If `$env:MSSQL_SA_PASSWORD` isn't set in your shell, source `.env.docker` first or paste the password directly. Expected: command exits 0, no output other than driver banners.

- [ ] **Step 3: Run initial migration**

Run: `npm run db:migrate -- --name init`
Expected output ends with: `Your database is now in sync with your schema.` and a new folder under `prisma/migrations/`.

- [ ] **Step 4: Verify with Prisma Studio**

Run: `npm run db:studio`
Expected: browser opens at `localhost:5555` showing all empty tables (Brand, Product, ProductVariant, ProductImage, User, Address, Cart, CartItem, Order, OrderItem, ServiceBooking, ConsignmentSubmission). Close studio when done (Ctrl+C in the terminal that ran it).

- [ ] **Step 5: Commit**

```bash
git add prisma/migrations
git commit -m "feat(db): initial migration with full commerce schema"
```

---

## Task 5: Prisma client singleton

**Files:**
- Create: `lib/db.ts`

- [ ] **Step 1: Create `lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Verify import compiles**

Run: `npx tsc --noEmit`
Expected: no errors. If `@prisma/client` types are missing, run `npx prisma generate` first.

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat(db): add prisma client singleton"
```

---

## Task 6: Seed script — brands, products, variants

**Files:**
- Create: `scripts/seed.ts` (catalog portion only — rest added in Task 7)

- [ ] **Step 1: Create `scripts/seed.ts` with brands + products**

```ts
import { PrismaClient, Prisma } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();

type SeedProduct = {
  slug: string;
  name: string;
  brand: "nike" | "adidas" | "supreme" | "hats";
  description: string;
  imageUrl: string;
  sourceUrl: string;
  basePrice?: string; // decimal as string
  sizes: string[];    // e.g. ["40","41",...] or ["S","M","L","XL"] or ["OS"]
};

const SNEAKER_SIZES = ["40", "41", "42", "43", "44", "45", "46"];
const APPAREL_SIZES = ["S", "M", "L", "XL"];
const OS = ["OS"];

const BRANDS = [
  { slug: "nike",    name: "Nike" },
  { slug: "adidas",  name: "Adidas" },
  { slug: "supreme", name: "Supreme" },
  { slug: "hats",    name: "Hats" },
];

// Pulled from data/products.json + hand-authored mocks
const PRODUCTS: SeedProduct[] = [
  // --- Nike (8) ---
  {
    slug: "jordan-3-retro-laser-orange-w-1",
    name: "Jordan 3 Retro Laser Orange (W)",
    brand: "nike",
    description: "STYLE CK9246-108 COLORWAY WHITE/LASER ORANGE-CEMENT GREY-BLACK RELEASE DATE 08/21/2020",
    imageUrl: "/images/products/jordan-3-retro-laser-orange-w-1.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/jordan-3-retro-laser-orange-w-1",
    basePrice: "320.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "jordan-1-low-dark-beetroot-black-w",
    name: "Jordan 1 Low Dark Beetroot Black (W)",
    brand: "nike",
    description: "STYLE DB6491-600 COLORWAY DARK BEETROOT/BLACK-WHITE RELEASE DATE 11/29/2020",
    imageUrl: "/images/products/jordan-1-low-dark-beetroot-black-w.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/jordan-1-low-dark-beetroot-black-w",
    basePrice: "240.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "jordan-1-mid-hyper-royal",
    name: "Jordan 1 Mid Hyper Royal",
    brand: "nike",
    description: "STYLE 554725-077 COLORWAY BLACK/HYPER ROYAL/WHITE",
    imageUrl: "/images/products/jordan-1-mid-hyper-royal.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/jordan-1-mid-hyper-royal",
    basePrice: "210.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "air-force-1-low-triple-white",
    name: "Air Force 1 Low Triple White",
    brand: "nike",
    description: "STYLE 315122-111 COLORWAY WHITE/WHITE",
    imageUrl: "/images/products/air-force-1-low-triple-white.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/air-force-1-low-triple-white",
    basePrice: "150.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "dunk-low-panda",
    name: "Dunk Low Panda",
    brand: "nike",
    description: "STYLE DD1391-100 COLORWAY WHITE/BLACK",
    imageUrl: "/images/products/dunk-low-panda.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/dunk-low-panda",
    basePrice: "180.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "jordan-4-retro-bred",
    name: "Jordan 4 Retro Bred",
    brand: "nike",
    description: "STYLE 308497-060 COLORWAY BLACK/CEMENT GREY-FIRE RED",
    imageUrl: "/images/products/jordan-4-retro-bred.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/jordan-4-retro-bred",
    basePrice: "350.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "jordan-11-cool-grey",
    name: "Jordan 11 Cool Grey",
    brand: "nike",
    description: "STYLE CT8012-005 COLORWAY MEDIUM GREY/WHITE-COOL GREY",
    imageUrl: "/images/products/jordan-11-cool-grey.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/jordan-11-cool-grey",
    basePrice: "380.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "air-max-90-infrared",
    name: "Air Max 90 Infrared",
    brand: "nike",
    description: "STYLE CT1685-100 COLORWAY WHITE/COOL GREY-INFRARED",
    imageUrl: "/images/products/air-max-90-infrared.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/air-max-90-infrared",
    basePrice: "175.00",
    sizes: SNEAKER_SIZES,
  },

  // --- Adidas (6) ---
  {
    slug: "yeezy-boost-350-v2-zebra",
    name: "Yeezy Boost 350 V2 Zebra",
    brand: "adidas",
    description: "STYLE CP9654 COLORWAY WHITE/CORE BLACK/RED",
    imageUrl: "/images/products/yeezy-boost-350-v2-zebra.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/yeezy-boost-350-v2-zebra",
    basePrice: "330.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "yeezy-boost-700-wave-runner",
    name: "Yeezy Boost 700 Wave Runner",
    brand: "adidas",
    description: "STYLE B75571 COLORWAY SOLID GREY/CHALK WHITE",
    imageUrl: "/images/products/yeezy-boost-700-wave-runner.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/yeezy-boost-700-wave-runner",
    basePrice: "360.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "yeezy-slide-bone",
    name: "Yeezy Slide Bone",
    brand: "adidas",
    description: "STYLE FZ5897 COLORWAY BONE/BONE",
    imageUrl: "/images/products/yeezy-slide-bone.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/yeezy-slide-bone",
    basePrice: "140.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "samba-og-cloud-white",
    name: "Samba OG Cloud White",
    brand: "adidas",
    description: "STYLE B75806 COLORWAY CLOUD WHITE/CORE BLACK",
    imageUrl: "/images/products/samba-og-cloud-white.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/samba-og-cloud-white",
    basePrice: "130.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "gazelle-bold-pink",
    name: "Gazelle Bold Pink",
    brand: "adidas",
    description: "STYLE HQ6889 COLORWAY PINK/CORE BLACK",
    imageUrl: "/images/products/gazelle-bold-pink.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/gazelle-bold-pink",
    basePrice: "135.00",
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "campus-00s-grey",
    name: "Campus 00s Grey",
    brand: "adidas",
    description: "STYLE HQ8707 COLORWAY GREY/CORE WHITE",
    imageUrl: "/images/products/campus-00s-grey.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/campus-00s-grey",
    basePrice: "125.00",
    sizes: SNEAKER_SIZES,
  },

  // --- Supreme (6 — apparel) ---
  {
    slug: "supreme-box-logo-tee-white",
    name: "Supreme Box Logo Tee White",
    brand: "supreme",
    description: "Cotton tee with red box logo print.",
    imageUrl: "/images/products/supreme-box-logo-tee-white.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/supreme-box-logo-tee-white",
    basePrice: "90.00",
    sizes: APPAREL_SIZES,
  },
  {
    slug: "supreme-box-logo-tee-black",
    name: "Supreme Box Logo Tee Black",
    brand: "supreme",
    description: "Black cotton tee with red box logo print.",
    imageUrl: "/images/products/supreme-box-logo-tee-black.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/supreme-box-logo-tee-black",
    basePrice: "90.00",
    sizes: APPAREL_SIZES,
  },
  {
    slug: "supreme-bogo-hoodie-grey",
    name: "Supreme Box Logo Hoodie Grey",
    brand: "supreme",
    description: "Heavyweight cotton hoodie with box logo embroidery.",
    imageUrl: "/images/products/supreme-bogo-hoodie-grey.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/supreme-bogo-hoodie-grey",
    basePrice: "220.00",
    sizes: APPAREL_SIZES,
  },
  {
    slug: "supreme-bogo-hoodie-navy",
    name: "Supreme Box Logo Hoodie Navy",
    brand: "supreme",
    description: "Navy box logo hoodie, heavyweight cotton.",
    imageUrl: "/images/products/supreme-bogo-hoodie-navy.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/supreme-bogo-hoodie-navy",
    basePrice: "220.00",
    sizes: APPAREL_SIZES,
  },
  {
    slug: "supreme-mountain-jacket",
    name: "Supreme Mountain Jacket",
    brand: "supreme",
    description: "Technical mountain shell with Supreme logo.",
    imageUrl: "/images/products/supreme-mountain-jacket.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/supreme-mountain-jacket",
    basePrice: "450.00",
    sizes: APPAREL_SIZES,
  },
  {
    slug: "supreme-arc-logo-crewneck",
    name: "Supreme Arc Logo Crewneck",
    brand: "supreme",
    description: "Heavyweight crewneck with embroidered arc logo.",
    imageUrl: "/images/products/supreme-arc-logo-crewneck.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/supreme-arc-logo-crewneck",
    basePrice: "180.00",
    sizes: APPAREL_SIZES,
  },

  // --- Hats (5 — OS) ---
  {
    slug: "new-era-yankees-black-cap",
    name: "New Era Yankees Black Cap",
    brand: "hats",
    description: "59FIFTY fitted, black on black NY embroidery.",
    imageUrl: "/images/products/new-era-yankees-black-cap.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/new-era-yankees-black-cap",
    basePrice: "55.00",
    sizes: OS,
  },
  {
    slug: "stussy-stock-low-pro-cap",
    name: "Stussy Stock Low Pro Cap",
    brand: "hats",
    description: "Low profile cap with Stussy stock script.",
    imageUrl: "/images/products/stussy-stock-low-pro-cap.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/stussy-stock-low-pro-cap",
    basePrice: "45.00",
    sizes: OS,
  },
  {
    slug: "carhartt-watch-beanie-black",
    name: "Carhartt Watch Beanie Black",
    brand: "hats",
    description: "Rib knit watch hat, classic Carhartt patch.",
    imageUrl: "/images/products/carhartt-watch-beanie-black.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/carhartt-watch-beanie-black",
    basePrice: "30.00",
    sizes: OS,
  },
  {
    slug: "patta-script-trucker",
    name: "Patta Script Trucker",
    brand: "hats",
    description: "Mesh-back trucker with embroidered Patta script.",
    imageUrl: "/images/products/patta-script-trucker.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/patta-script-trucker",
    basePrice: "50.00",
    sizes: OS,
  },
  {
    slug: "kith-classic-logo-cap",
    name: "Kith Classic Logo Cap",
    brand: "hats",
    description: "Six-panel cap with embroidered Kith script.",
    imageUrl: "/images/products/kith-classic-logo-cap.jpg",
    sourceUrl: "https://www.eightyfiveeleven.com/product-page/kith-classic-logo-cap",
    basePrice: "55.00",
    sizes: OS,
  },
];

// Deterministic pseudo-random so seed runs reproducibly
function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rnd = prng(8511);

async function seedBrands() {
  for (const b of BRANDS) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      create: b,
      update: { name: b.name },
    });
  }
}

async function seedProducts() {
  for (const p of PRODUCTS) {
    const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: p.brand } });
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        brandId: brand.id,
        description: p.description,
        imageUrl: p.imageUrl,
        sourceUrl: p.sourceUrl,
        basePrice: p.basePrice ? new Prisma.Decimal(p.basePrice) : null,
      },
      update: {
        name: p.name,
        brandId: brand.id,
        description: p.description,
        imageUrl: p.imageUrl,
        sourceUrl: p.sourceUrl,
        basePrice: p.basePrice ? new Prisma.Decimal(p.basePrice) : null,
      },
    });

    for (const size of p.sizes) {
      const stock = Math.floor(rnd() * 9); // 0..8
      await prisma.productVariant.upsert({
        where: { productId_sizeEu: { productId: product.id, sizeEu: size } },
        create: {
          productId: product.id,
          sizeEu: size,
          sku: `${p.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${size}`,
          stock,
        },
        update: { stock },
      });
    }
  }
}

async function main() {
  console.log("Seeding brands...");
  await seedBrands();
  console.log("Seeding products + variants...");
  await seedProducts();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Commit (script only, not yet run)**

```bash
git add scripts/seed.ts
git commit -m "feat(db): seed script for brands, products, variants"
```

---

## Task 7: Extend seed script — users, addresses, orders, services

**Files:**
- Modify: `scripts/seed.ts`

- [ ] **Step 1: Add seed sections after `seedProducts` in `scripts/seed.ts`**

Append before `async function main()`:

```ts
const USERS = [
  { email: "omar@example.com",  name: "Omar A.",     phone: "+962 7 9000 0001",
    address: { line1: "1 Swefieh St.", city: "Amman",  country: "Jordan",        postal: "11183" } },
  { email: "lina@example.com",  name: "Lina K.",     phone: "+962 7 9000 0002",
    address: { line1: "12 Rainbow St.", city: "Amman", country: "Jordan",        postal: "11181" } },
  { email: "yusuf@example.com", name: "Yusuf M.",    phone: "+966 5 0000 0003",
    address: { line1: "King Fahd Rd.",  city: "Riyadh",country: "Saudi Arabia",  postal: "12211" } },
  { email: "noor@example.com",  name: "Noor S.",     phone: "+971 5 0000 0004",
    address: { line1: "Marina Walk",    city: "Dubai", country: "UAE",           postal: "00000" } },
];

async function seedUsers() {
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, phone: u.phone },
      update: { name: u.name, phone: u.phone },
    });
    const existing = await prisma.address.findFirst({ where: { userId: user.id } });
    if (!existing) {
      await prisma.address.create({
        data: { ...u.address, userId: user.id, isDefault: true },
      });
    }
  }
}

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "paid", "shipped"];

async function seedOrders() {
  const users = await prisma.user.findMany({ include: { addresses: true } });
  const products = await prisma.product.findMany({ include: { variants: true } });

  for (let i = 0; i < ORDER_STATUSES.length; i++) {
    const user = users[i % users.length];
    if (!user.addresses[0]) continue;
    const orderNumber = `8511-${String(100 + i).padStart(6, "0")}`;
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) continue;

    const product = products[i % products.length];
    const variant = product.variants[i % product.variants.length];
    const unitPrice = product.basePrice ?? new Prisma.Decimal("100.00");
    const quantity = 1 + (i % 2);
    const subtotal = unitPrice.mul(quantity);
    const shipping = new Prisma.Decimal("10.00");
    const total = subtotal.add(shipping);

    await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: user.addresses[0].id,
        status: ORDER_STATUSES[i],
        subtotal,
        shipping,
        total,
        items: {
          create: [
            {
              productId: product.id,
              variantId: variant?.id,
              sizeEu: variant?.sizeEu,
              unitPrice,
              quantity,
            },
          ],
        },
      },
    });
  }
}

const CONSIGNMENTS = [
  { productName: "Jordan 1 Retro High Chicago", brand: "nike",   sizeEu: "43", conditionNote: "Worn twice, OG box.", askingPrice: "650.00", status: "submitted" },
  { productName: "Yeezy 350 Beluga 2.0",         brand: "adidas", sizeEu: "42", conditionNote: "DS, never worn.",     askingPrice: "420.00", status: "reviewing" },
  { productName: "Supreme Box Logo Hoodie Red",  brand: "supreme",sizeEu: "L",  conditionNote: "Light pilling.",      askingPrice: "320.00", status: "accepted" },
  { productName: "Air Max 1 Atmos Elephant",     brand: "nike",   sizeEu: "44", conditionNote: "VNDS.",               askingPrice: "550.00", status: "listed" },
  { productName: "Travis Scott Jordan 1 Low",    brand: "nike",   sizeEu: "42", conditionNote: "DS with receipt.",    askingPrice: "1200.00", status: "sold" },
];

async function seedConsignments() {
  const omar = await prisma.user.findUniqueOrThrow({ where: { email: "omar@example.com" } });
  for (const c of CONSIGNMENTS) {
    const existing = await prisma.consignmentSubmission.findFirst({ where: { productName: c.productName } });
    if (existing) continue;
    await prisma.consignmentSubmission.create({
      data: {
        userId: omar.id,
        productName: c.productName,
        brand: c.brand,
        sizeEu: c.sizeEu,
        conditionNote: c.conditionNote,
        askingPrice: new Prisma.Decimal(c.askingPrice),
        imageUrls: JSON.stringify([]),
        status: c.status,
      },
    });
  }
}

const BOOKINGS = [
  { serviceKey: "svc-restoration",   contactName: "Omar A.",  contactEmail: "omar@example.com",  notes: "Yellowed midsoles on Jordan 4."  },
  { serviceKey: "svc-auth",          contactName: "Lina K.",  contactEmail: "lina@example.com",  notes: "Authenticate a pair of Yeezy 700." },
  { serviceKey: "svc-laundry",       contactName: "Yusuf M.", contactEmail: "yusuf@example.com", notes: "Deep clean two pairs."           },
  { serviceKey: "svc-art",           contactName: "Noor S.",  contactEmail: "noor@example.com",  notes: "Custom artwork on AF1."          },
];

async function seedBookings() {
  for (const b of BOOKINGS) {
    const existing = await prisma.serviceBooking.findFirst({
      where: { serviceKey: b.serviceKey, contactEmail: b.contactEmail },
    });
    if (existing) continue;
    await prisma.serviceBooking.create({ data: b });
  }
}
```

- [ ] **Step 2: Extend `main()` to call new seeders**

Replace the existing `main()` in `scripts/seed.ts` with:

```ts
async function main() {
  console.log("Seeding brands...");
  await seedBrands();
  console.log("Seeding products + variants...");
  await seedProducts();
  console.log("Seeding users + addresses...");
  await seedUsers();
  console.log("Seeding orders...");
  await seedOrders();
  console.log("Seeding consignment submissions...");
  await seedConsignments();
  console.log("Seeding service bookings...");
  await seedBookings();
  console.log("Done.");
}
```

- [ ] **Step 3: Run the seed**

Run: `npm run db:seed`
Expected: logs each phase, no errors. Exit code 0.

- [ ] **Step 4: Verify counts**

Run: `npm run db:studio`
Expected counts: Brand=4, Product=25, ProductVariant=~140 (varies with sizes per category), User=4, Address=4, Order=6, OrderItem=6, ConsignmentSubmission=5, ServiceBooking=4. Close studio when done.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat(db): seed users, orders, consignments, bookings"
```

---

## Task 8: Rewrite `lib/catalog.ts` (Prisma-backed) + tests

**Files:**
- Modify: `lib/catalog.ts`
- Modify: `tests/lib/catalog.test.ts` (full replacement)

- [ ] **Step 1: Replace `tests/lib/catalog.test.ts` with new failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { loadProducts, getProductBySlug, loadKB } from "@/lib/catalog";

describe("catalog", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("loadProducts returns products with brand and variants", async () => {
    const products = await loadProducts();
    expect(products.length).toBeGreaterThan(0);
    const p = products[0];
    expect(p.brand).toBeDefined();
    expect(p.brand.slug).toMatch(/nike|adidas|supreme|hats/);
    expect(Array.isArray(p.variants)).toBe(true);
  });

  it("getProductBySlug returns one product or null", async () => {
    const all = await loadProducts();
    const slug = all[0].slug;
    const single = await getProductBySlug(slug);
    expect(single?.slug).toBe(slug);
    expect(single?.variants.length).toBeGreaterThan(0);

    const missing = await getProductBySlug("definitely-not-a-real-slug-xyz");
    expect(missing).toBeNull();
  });

  it("loadKB still reads data/kb.json", () => {
    const kb = loadKB();
    expect(kb.length).toBeGreaterThan(0);
    expect(kb[0].type).toMatch(/service|about|store|contact/);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- tests/lib/catalog.test.ts`
Expected: failure (the test imports `getProductBySlug` which doesn't exist yet, and `loadProducts` is sync returning the JSON-shaped objects).

- [ ] **Step 3: Replace `lib/catalog.ts`**

```ts
import { z } from "zod";
import fs from "node:fs";
import { prisma } from "@/lib/db";

export const KBChunkSchema = z.object({
  id: z.string(),
  type: z.enum(["service", "about", "store", "contact"]),
  title: z.string(),
  text: z.string(),
});
export type KBChunk = z.infer<typeof KBChunkSchema>;

export async function loadProducts() {
  return prisma.product.findMany({
    include: {
      brand: true,
      variants: { orderBy: { sizeEu: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      variants: { orderBy: { sizeEu: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export type ProductWithRelations = Awaited<ReturnType<typeof getProductBySlug>>;

export function loadKB(file = "data/kb.json"): KBChunk[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return z.array(KBChunkSchema).parse(raw);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/lib/catalog.test.ts`
Expected: 3 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/catalog.ts tests/lib/catalog.test.ts
git commit -m "refactor(catalog): switch loadProducts to prisma; keep loadKB on files"
```

---

## Task 9: Update home page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Make `Home` async and adapt to new shape**

Replace the top of `app/page.tsx` (function signature + `const products` / `featured` / `heroProduct` lines):

```tsx
export default async function Home() {
  const products = await loadProducts();
  const featured = products.slice(0, 3);
  const services = loadKB().filter(c => c.type === "service").slice(0, 4);
  const heroProduct = products[0];
```

In the `featured.map(p => ...)` block, replace `BRAND_LABEL[p.brand]` with `BRAND_LABEL[p.brand.slug]` and replace `p.price` with `formatPrice(p)`.

Add this helper at the top of the file (after imports, before the `BRAND_LABEL` const):

```tsx
function formatPrice(p: { basePrice: { toString(): string } | null }) {
  return p.basePrice ? `${p.basePrice.toString()} JOD` : null;
}
```

- [ ] **Step 2: Build & test the page**

Run: `npm run dev` (in a second terminal, leave it running)
Open: `http://localhost:3000`
Expected: hero, marquee, featured drops, services, locator all render. Featured product cards show name + price or brand label fallback. No console errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "refactor(home): use prisma-backed loadProducts and brand.slug"
```

---

## Task 10: Update shop and brand pages

**Files:**
- Modify: `app/shop/page.tsx`
- Modify: `app/shop/[brand]/page.tsx`

- [ ] **Step 1: Update `app/shop/page.tsx`**

Make the default export `async`. Replace `const products = loadProducts();` with `const products = await loadProducts();`. Inside the `.map` over products, replace `BRAND_LABEL[p.brand]` with `BRAND_LABEL[p.brand.slug]` and `{p.price && ...}` with the helper used in Task 9 — duplicate the same `formatPrice` helper into this file (intentionally not abstracting into shared module per YAGNI; two callsites).

- [ ] **Step 2: Update `app/shop/[brand]/page.tsx`**

Make the default export `async`. Replace `loadProducts().filter(p => p.brand === brand)` with:

```tsx
const all = await loadProducts();
const products = all.filter(p => p.brand.slug === brand);
```

Add the same `formatPrice` helper here.

- [ ] **Step 3: Verify in browser**

`http://localhost:3000/shop` → grid of all 25 products.
`http://localhost:3000/shop/nike` → 8 products.
`http://localhost:3000/shop/adidas` → 6 products.
`http://localhost:3000/shop/supreme` → 6 products.
`http://localhost:3000/shop/hats` → 5 products.
Item count badge updates to match.

- [ ] **Step 4: Commit**

```bash
git add app/shop/page.tsx "app/shop/[brand]/page.tsx"
git commit -m "refactor(shop): use prisma-backed loadProducts and brand.slug"
```

---

## Task 11: Update PDP — variants drive size buttons

**Files:**
- Modify: `app/product/[slug]/page.tsx`

- [ ] **Step 1: Switch data source from `loadProducts().find(...)` to `getProductBySlug`**

At the top of the file, replace the import line:

```tsx
import { loadProducts } from "@/lib/catalog";
```

with:

```tsx
import { getProductBySlug, loadProducts } from "@/lib/catalog";
```

Inside `PDP`, replace:

```tsx
const products = loadProducts();
const p = products.find(x => x.slug === slug);
if (!p) notFound();
const brandLabel = BRAND_LABEL[p.brand];
const specs = extractSpecs(p.description);
const related = products.filter(q => q.brand === p.brand && q.slug !== p.slug).slice(0, 4);
```

with:

```tsx
const p = await getProductBySlug(slug);
if (!p) notFound();
const brandLabel = BRAND_LABEL[p.brand.slug];
const specs = extractSpecs(p.description);
const all = await loadProducts();
const related = all.filter(q => q.brand.slug === p.brand.slug && q.slug !== p.slug).slice(0, 4);
const price = p.basePrice ? `${p.basePrice.toString()} JOD` : null;
```

- [ ] **Step 2: Replace the hardcoded size-button block with variants**

Find the `<div className="grid grid-cols-4 sm:grid-cols-7 gap-2">` block and replace its body (`{[40, 41, 42, 43, 44, 45, 46].map(...)}`) with:

```tsx
{p.variants.map((v, i) => {
  const soldOut = v.stock <= 0;
  return (
    <button
      key={v.id}
      type="button"
      disabled={soldOut}
      className={
        soldOut
          ? "h-12 border border-[#0A0A0A]/10 font-body text-sm text-[#0A0A0A]/30 line-through cursor-not-allowed rounded-sm"
          : i === 0
          ? "h-12 bg-[#0A0A0A] text-[#F7F7F4] font-body text-sm rounded-sm"
          : "h-12 border border-[#0A0A0A]/20 font-body text-sm hover:border-[#0A0A0A] transition-colors rounded-sm"
      }
    >
      {v.sizeEu}
    </button>
  );
})}
```

Also change `{p.price && <div ...>{p.price}</div>}` to `{price && <div className="text-2xl md:text-[28px] font-body font-medium mb-8">{price}</div>}`.

In the related-products section, change `BRAND_LABEL[r.brand]` (if present) and `{r.price && ...}` similarly: `r.brand.slug` and `${r.basePrice?.toString()} JOD`.

- [ ] **Step 3: Verify in browser**

Visit a few PDPs:
- `/product/jordan-3-retro-laser-orange-w-1` → 7 size buttons (40–46) with some sold-out (line-through)
- `/product/supreme-box-logo-tee-white` → 4 size buttons (S/M/L/XL)
- `/product/new-era-yankees-black-cap` → 1 size button (OS)

Related grid still renders. Price shows "X JOD" where set.

- [ ] **Step 4: Commit**

```bash
git add "app/product/[slug]/page.tsx"
git commit -m "refactor(pdp): drive size buttons from product variants"
```

---

## Task 12: Update `/api/products` route and chat ProductCard

**Files:**
- Modify: `app/api/products/route.ts`
- Modify: `components/chat/ProductCard.tsx`

- [ ] **Step 1: Rewrite `/api/products/route.ts` to return a flattened shape**

```ts
import { loadProducts } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET() {
  const products = await loadProducts();
  const payload = products.map(p => ({
    slug: p.slug,
    name: p.name,
    brand: p.brand.slug,
    price: p.basePrice ? `${p.basePrice.toString()} JOD` : undefined,
    image_url: p.imageUrl,
    source_url: p.sourceUrl,
    description: p.description,
  }));
  return Response.json(payload);
}
```

This keeps the chat ProductCard contract (`Product` from old `lib/catalog`) compatible — same field names.

- [ ] **Step 2: Update `components/chat/ProductCard.tsx` type import**

The old import `import type { Product } from "@/lib/catalog";` no longer resolves to the same shape. Replace it with a local type declaration at the top of the file:

```tsx
type Product = {
  slug: string;
  name: string;
  brand: "nike" | "adidas" | "supreme" | "hats";
  price?: string;
  image_url: string;
  source_url: string;
  description: string;
};
```

Remove the old `import type { Product }` line. The rest of the component already reads `p.brand`, `p.price`, `p.name`, `p.image_url` — all preserved by the route's flatten.

- [ ] **Step 3: Verify chat product cards render**

Open `/chat` (or the widget on any other page), click suggested chip "WHAT YEEZYS DO YOU HAVE?". Wait for assistant response; if it embeds `<product slug=... />` cards, they should display correctly.

If the assistant doesn't embed cards for that query, force one manually by editing `/api/chat` output isn't needed — just confirm `/api/products` works:

Run: `curl http://localhost:3000/api/products | head -c 400`
Expected: JSON array starting with `[{"slug":"...","name":"...","brand":"...","price":"...","image_url":"...","source_url":"...","description":"..."}`.

- [ ] **Step 4: Commit**

```bash
git add app/api/products/route.ts components/chat/ProductCard.tsx
git commit -m "refactor(api): flatten /api/products to preserve chat card contract"
```

---

## Task 13: Cart route handlers + tests

**Files:**
- Create: `app/api/cart/route.ts`
- Create: `app/api/cart/[id]/route.ts`
- Create: `tests/api/cart.test.ts`

- [ ] **Step 1: Write failing tests for cart**

Create `tests/api/cart.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { POST, GET } from "@/app/api/cart/route";
import { DELETE } from "@/app/api/cart/[id]/route";

async function postJson(url: string, body: unknown, cookie?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers["cookie"] = cookie;
  return new Request(url, { method: "POST", headers, body: JSON.stringify(body) });
}
async function getReq(url: string, cookie?: string) {
  const headers: Record<string, string> = {};
  if (cookie) headers["cookie"] = cookie;
  return new Request(url, { method: "GET", headers });
}

describe("cart api", () => {
  let productId: number;
  let variantId: number;

  beforeAll(async () => {
    const p = await prisma.product.findFirstOrThrow({ include: { variants: true } });
    productId = p.id;
    variantId = p.variants[0].id;
  });

  afterEach(async () => {
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({ where: { userId: null } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("POST creates a guest cart and adds an item, returning a session cookie", async () => {
    const res = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 1 }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/cart_sid=/);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].productId).toBe(productId);
  });

  it("GET returns the cart belonging to the session cookie", async () => {
    const postRes = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 2 }));
    const cookie = postRes.headers.get("set-cookie")!.split(";")[0];
    const getRes = await GET(await getReq("http://test/api/cart", cookie));
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.items[0].quantity).toBe(2);
  });

  it("DELETE removes a cart item", async () => {
    const postRes = await POST(await postJson("http://test/api/cart", { productId, variantId, quantity: 1 }));
    const cookie = postRes.headers.get("set-cookie")!.split(";")[0];
    const { items } = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    const itemId = items[0].id;
    const delRes = await DELETE(new Request(`http://test/api/cart/${itemId}`, { method: "DELETE", headers: { cookie } }), { params: Promise.resolve({ id: String(itemId) }) });
    expect(delRes.status).toBe(200);
    const after = await (await GET(await getReq("http://test/api/cart", cookie))).json();
    expect(after.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- tests/api/cart.test.ts`
Expected: failure — `Cannot find module @/app/api/cart/route`.

- [ ] **Step 3: Implement `app/api/cart/route.ts`**

```ts
import { prisma } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const COOKIE = "cart_sid";

function readSid(req: Request): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === COOKIE) return v ?? null;
  }
  return null;
}

function setSidHeader(sid: string): HeadersInit {
  return {
    "set-cookie": `${COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
    "content-type": "application/json",
  };
}

async function getOrCreateCart(sid: string) {
  const existing = await prisma.cart.findFirst({
    where: { sessionId: sid, userId: null },
    include: { items: true },
  });
  if (existing) return existing;
  return prisma.cart.create({
    data: { sessionId: sid },
    include: { items: true },
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    productId: number;
    variantId?: number;
    quantity?: number;
  };
  if (!body.productId) {
    return new Response(JSON.stringify({ error: "productId required" }), { status: 400 });
  }
  let sid = readSid(req);
  const isNew = !sid;
  if (!sid) sid = randomUUID();

  const cart = await getOrCreateCart(sid);
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: body.productId,
      variantId: body.variantId,
      quantity: body.quantity ?? 1,
    },
  });
  const fresh = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: { items: true },
  });
  return new Response(JSON.stringify(fresh), {
    status: 200,
    headers: isNew ? setSidHeader(sid) : { "content-type": "application/json" },
  });
}

export async function GET(req: Request) {
  const sid = readSid(req);
  if (!sid) return Response.json({ items: [] });
  const cart = await prisma.cart.findFirst({
    where: { sessionId: sid, userId: null },
    include: { items: true },
  });
  return Response.json(cart ?? { items: [] });
}
```

- [ ] **Step 4: Implement `app/api/cart/[id]/route.ts`**

```ts
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return new Response(JSON.stringify({ error: "invalid id" }), { status: 400 });
  }
  await prisma.cartItem.delete({ where: { id: numeric } }).catch(() => null);
  return Response.json({ ok: true });
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/api/cart.test.ts`
Expected: 3 pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/cart tests/api/cart.test.ts
git commit -m "feat(cart): add cart route handlers with guest-session cookies"
```

---

## Task 14: Order, consignment, booking server actions + tests

**Files:**
- Create: `app/actions/orders.ts`
- Create: `app/actions/consignment.ts`
- Create: `app/actions/bookings.ts`
- Create: `tests/actions/orders.test.ts`
- Create: `tests/actions/consignment.test.ts`
- Create: `tests/actions/bookings.test.ts`

- [ ] **Step 1: Write tests for all three actions**

Create `tests/actions/orders.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { placeOrder } from "@/app/actions/orders";

describe("placeOrder", () => {
  let userId: number, addressId: number, productId: number, variantId: number;

  beforeAll(async () => {
    const u = await prisma.user.findFirstOrThrow({ include: { addresses: true } });
    userId = u.id;
    addressId = u.addresses[0].id;
    const p = await prisma.product.findFirstOrThrow({ include: { variants: true } });
    productId = p.id;
    variantId = p.variants[0].id;
  });

  afterAll(() => prisma.$disconnect());

  it("creates an order with snapshot prices and an item", async () => {
    const result = await placeOrder({
      userId,
      addressId,
      items: [{ productId, variantId, quantity: 1 }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: result.orderId },
      include: { items: true },
    });
    expect(order.items).toHaveLength(1);
    expect(Number(order.total)).toBeGreaterThan(0);
  });

  it("rejects empty item list", async () => {
    const result = await placeOrder({ userId, addressId, items: [] });
    expect(result.ok).toBe(false);
  });
});
```

Create `tests/actions/consignment.test.ts`:

```ts
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { submitConsignment } from "@/app/actions/consignment";

describe("submitConsignment", () => {
  afterAll(() => prisma.$disconnect());

  it("creates a submission with status 'submitted'", async () => {
    const r = await submitConsignment({
      productName: "Test Pair",
      brand: "nike",
      sizeEu: "42",
      askingPrice: "100.00",
      imageUrls: ["https://example.com/a.jpg"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    const sub = await prisma.consignmentSubmission.findUniqueOrThrow({ where: { id: r.id } });
    expect(sub.status).toBe("submitted");
    expect(JSON.parse(sub.imageUrls)).toEqual(["https://example.com/a.jpg"]);
    await prisma.consignmentSubmission.delete({ where: { id: r.id } });
  });

  it("rejects missing required fields", async () => {
    const r = await submitConsignment({ productName: "", brand: "nike", imageUrls: [] });
    expect(r.ok).toBe(false);
  });
});
```

Create `tests/actions/bookings.test.ts`:

```ts
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { bookService } from "@/app/actions/bookings";

describe("bookService", () => {
  afterAll(() => prisma.$disconnect());

  it("creates a booking with status 'new'", async () => {
    const r = await bookService({
      serviceKey: "svc-laundry",
      contactName: "Test User",
      contactEmail: "test@example.com",
      notes: "Two pairs.",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    const b = await prisma.serviceBooking.findUniqueOrThrow({ where: { id: r.id } });
    expect(b.status).toBe("new");
    await prisma.serviceBooking.delete({ where: { id: r.id } });
  });

  it("rejects missing email", async () => {
    const r = await bookService({
      serviceKey: "svc-laundry",
      contactName: "Test",
      contactEmail: "",
    });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- tests/actions`
Expected: failures — modules don't exist yet.

- [ ] **Step 3: Implement `app/actions/orders.ts`**

```ts
"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type PlaceOrderInput = {
  userId: number;
  addressId: number;
  items: { productId: number; variantId?: number; quantity: number }[];
};

export type PlaceOrderResult =
  | { ok: true; orderId: number; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!input.items.length) return { ok: false, error: "no items" };

  return prisma.$transaction(async (tx) => {
    const productIds = input.items.map(i => i.productId);
    const variantIds = input.items.map(i => i.variantId).filter((v): v is number => typeof v === "number");
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const variants = await tx.productVariant.findMany({ where: { id: { in: variantIds } } });

    let subtotal = new Prisma.Decimal(0);
    const itemRows: Prisma.OrderItemCreateManyOrderInput[] = [];

    for (const i of input.items) {
      const product = products.find(p => p.id === i.productId);
      if (!product) return { ok: false as const, error: `product ${i.productId} missing` };
      const variant = i.variantId ? variants.find(v => v.id === i.variantId) : undefined;
      const unitPrice = variant?.price ?? product.basePrice ?? new Prisma.Decimal("0");
      subtotal = subtotal.add(unitPrice.mul(i.quantity));
      itemRows.push({
        productId: product.id,
        variantId: variant?.id,
        sizeEu: variant?.sizeEu,
        unitPrice,
        quantity: i.quantity,
      });
    }

    const shipping = new Prisma.Decimal("10.00");
    const total = subtotal.add(shipping);
    const count = await tx.order.count();
    const orderNumber = `8511-${String(1000 + count).padStart(6, "0")}`;

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        addressId: input.addressId,
        subtotal,
        shipping,
        total,
        items: { create: itemRows },
      },
    });
    return { ok: true as const, orderId: order.id, orderNumber: order.orderNumber };
  });
}
```

- [ ] **Step 4: Implement `app/actions/consignment.ts`**

```ts
"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type SubmitConsignmentInput = {
  userId?: number;
  productName: string;
  brand: string;
  sizeEu?: string;
  conditionNote?: string;
  askingPrice?: string;
  imageUrls: string[];
};

export type SubmitConsignmentResult = { ok: true; id: number } | { ok: false; error: string };

export async function submitConsignment(input: SubmitConsignmentInput): Promise<SubmitConsignmentResult> {
  if (!input.productName.trim()) return { ok: false, error: "productName required" };
  if (!input.brand.trim())       return { ok: false, error: "brand required" };

  const row = await prisma.consignmentSubmission.create({
    data: {
      userId: input.userId,
      productName: input.productName,
      brand: input.brand,
      sizeEu: input.sizeEu,
      conditionNote: input.conditionNote,
      askingPrice: input.askingPrice ? new Prisma.Decimal(input.askingPrice) : null,
      imageUrls: JSON.stringify(input.imageUrls ?? []),
    },
  });
  return { ok: true, id: row.id };
}
```

- [ ] **Step 5: Implement `app/actions/bookings.ts`**

```ts
"use server";

import { prisma } from "@/lib/db";

export type BookServiceInput = {
  userId?: number;
  serviceKey: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
};

export type BookServiceResult = { ok: true; id: number } | { ok: false; error: string };

export async function bookService(input: BookServiceInput): Promise<BookServiceResult> {
  if (!input.contactEmail.trim()) return { ok: false, error: "contactEmail required" };
  if (!input.contactName.trim())  return { ok: false, error: "contactName required" };
  if (!input.serviceKey.trim())   return { ok: false, error: "serviceKey required" };

  const row = await prisma.serviceBooking.create({
    data: {
      userId: input.userId,
      serviceKey: input.serviceKey,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      notes: input.notes,
    },
  });
  return { ok: true, id: row.id };
}
```

- [ ] **Step 6: Run all action tests**

Run: `npm test -- tests/actions`
Expected: 6 pass total (2 per file).

- [ ] **Step 7: Run full test suite**

Run: `npm test`
Expected: all green (catalog, cart, actions).

- [ ] **Step 8: Commit**

```bash
git add app/actions tests/actions
git commit -m "feat(actions): add placeOrder, submitConsignment, bookService server actions"
```

---

## Task 15: README, dev-workflow docs, and final cleanup

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Append a "Local DB workflow" section to `README.md`**

```markdown
## Local database (MS SQL Server in Docker)

The catalog and write paths are backed by SQL Server running in Docker.

### One-time setup

1. Copy `.env.example` to `.env.docker` and `.env.local`. Set a strong `MSSQL_SA_PASSWORD` (≥8 chars, upper+lower+digit+symbol). Use the same password in both files' `DATABASE_URL` / `MSSQL_SA_PASSWORD`.
2. `npm run db:up` — starts SQL Server in Docker. Wait for `healthy`.
3. Create the `eighty_five_eleven` database:
   ```powershell
   docker exec -it eighty-five-eleven-mssql /opt/mssql-tools18/bin/sqlcmd \
     -S localhost -U sa -P "$env:MSSQL_SA_PASSWORD" -C \
     -Q "CREATE DATABASE eighty_five_eleven"
   ```
4. `npm run db:migrate` — apply all migrations.
5. `npm run db:seed` — load brands, products, variants, mock users/orders.

### Daily workflow

```
npm run db:up      # start DB
npm run dev        # start Next.js
# ... work ...
npm run db:down    # stop DB (data persists in the docker volume)
```

### Useful commands

- `npm run db:studio` — open Prisma Studio (browser table viewer) on localhost:5555
- `npm run db:reset` — drop and recreate all tables, then re-seed (destructive)

### Knowledge base

`data/kb.json` stays as the RAG corpus. It is **not** in SQL — embeddings are built from this file by `scripts/embed.ts`.
```

- [ ] **Step 2: Final full-suite test run**

Run: `npm test`
Expected: all green.

Run: `npm run build`
Expected: build succeeds (no TS errors).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document local DB workflow"
```

---

## Acceptance check (read against spec)

- [x] `docker compose up` brings the DB online — Task 1
- [x] `npm run db:migrate && npm run db:seed` creates schema and loads mock data — Tasks 4, 7
- [x] `npm run dev` → home, shop, brand pages, PDPs render from DB — Tasks 9, 10, 11
- [x] Chat widget's product cards still work — Task 12
- [x] Six new write endpoints/actions exist and insert rows — Tasks 13, 14
- [x] All existing tests still pass — Task 15

---

## Notes for the executor

- If `prisma migrate dev` fails with a connection error after `db:up` reports healthy, wait 15s and retry. SQL Server sometimes returns the TCP listener before it's truly accepting logins.
- `Decimal` values come back as Prisma `Decimal` objects. `.toString()` is safe in JSX. Don't `Number()` them — that loses precision.
- `app/actions/*` files are server actions because of the `"use server"` directive — they can be called both from forms and from imports (as the tests do).
- The chat ProductCard's flattened `Product` type is intentionally duplicated rather than shared. There's exactly one consumer; sharing it would couple it to a layer that no longer naturally produces this shape.
