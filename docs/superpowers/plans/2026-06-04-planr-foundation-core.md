# Planr Foundation Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a clean Turborepo monorepo whose CI (typecheck · lint · test) is green from the first commit, containing the `@planr/db` tenancy+event schema and the pure-logic domain engines (`@planr/core`: event-type registry, capability registry, entitlement resolver, RBAC) — fully unit-tested, with the "no Prisma outside `@planr/db`" boundary enforced by lint.

**Architecture:** A pnpm + Turborepo monorepo. `@planr/config` holds zod-validated env + shared tooling config. `@planr/db` owns the Prisma schema (the single source of truth for data; the only place `@prisma/client` may be imported). `@planr/core` holds framework-free domain logic: declarative registries for event types and capability modules, a deterministic entitlement/module-access resolver implementing the spec's "relevant-to-type AND entitled" rule, and a role→permission RBAC matrix. No external services are touched in this plan, so everything is unit-testable with Vitest.

**Tech Stack:** pnpm workspaces, Turborepo, TypeScript (strict), Vitest, ESLint (flat config) + `@typescript-eslint`, Zod, Prisma 6 (schema authored + validated; live DB deferred to Plan 2), GitHub Actions.

**Reference spec:** `docs/superpowers/specs/2026-06-04-planr-foundation-design.md`

**Shared domain vocabulary (used consistently across all tasks):**

- `EventTypeKey` — a `string` brand (NOT a DB enum): `'wedding' | 'birthday' | 'funeral' | 'bridal_shower' | 'corporate'`. Only `wedding` is registered in this plan. New types are registry entries, never migrations.
- `ModuleKey` — `'guests' | 'venue' | 'vendors' | 'vendor_matching' | 'budget' | 'tasks' | 'rsvp' | 'messaging' | 'seating' | 'gift_registry' | 'agenda' | 'order_of_service'`.
- `ModuleTier` — `'core' | 'advanced'`.
- `Role` — `'owner' | 'admin' | 'planner' | 'editor' | 'viewer'`.
- `Entitlement` (string grant): `event_type:<EventTypeKey>` | `module:<ModuleKey>` | `all_access`.
- Resolver function: `resolveModuleAccess({ module, eventType, held }) => { visible, locked, reason }`.
- RBAC: `roleHasPermission(role, permission)` / `permissionsForRole(role)`.

---

## File structure (locked before tasks)

```
planr/
  package.json                      # root: pnpm workspace + turbo scripts
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json                # shared strict TS settings
  vitest.workspace.ts               # runs every package's tests
  eslint.config.mjs                 # flat config + architectural boundary rule
  .github/workflows/ci.yml          # typecheck · lint · test
  .env.example
  packages/
    config/
      package.json                  # @planr/config
      tsconfig.json
      src/env.ts                    # zod env schema + parseEnv()
      src/env.test.ts
      src/index.ts
    db/
      package.json                  # @planr/db
      tsconfig.json
      prisma/schema.prisma          # Organization, Membership, User, Event, Subscription, Entitlement
      src/index.ts                  # re-exports PrismaClient (only legal @prisma/client import site)
    core/
      package.json                  # @planr/core
      tsconfig.json
      src/types.ts                  # EventTypeKey, ModuleKey, ModuleTier, Role, Permission, Entitlement
      src/event-types/registry.ts   # eventTypeProfiles + getEventTypeProfile()
      src/event-types/registry.test.ts
      src/capabilities/registry.ts  # moduleDefinitions + getModule() + modulesForEventType()
      src/capabilities/registry.test.ts
      src/entitlements/resolver.ts  # resolveModuleAccess() + FREE_BASELINE_MODULES
      src/entitlements/resolver.test.ts
      src/rbac/policy.ts            # roleHasPermission() + permissionsForRole()
      src/rbac/policy.test.ts
      src/index.ts
    eslint-fixtures/                # tiny fixtures proving the boundary rule fires
      illegal-prisma-import.ts
```

---

## Task 1: Monorepo scaffold + CI gates

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `vitest.workspace.ts`, `eslint.config.mjs`, `.env.example`, `.github/workflows/ci.yml`, `.gitignore`

- [ ] **Step 1: Create the pnpm workspace manifest**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

Create root `package.json`:

```json
{
  "name": "planr",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "eslint": "^9.12.0",
    "typescript-eslint": "^8.8.0"
  }
}
```

- [ ] **Step 2: Create shared TypeScript + Turbo config**

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "composite": false,
    "verbatimModuleSyntax": true
  }
}
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Step 3: Create the Vitest workspace + ESLint flat config + .gitignore**

Create `vitest.workspace.ts`:

```ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace(["packages/*"]);
```

Create `eslint.config.mjs` (the architectural boundary rule is added in Task 8; this is the base):

```js
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/generated/**"],
  },
  ...tseslint.configs.recommended,
);
```

Create `.gitignore`:

```
node_modules/
dist/
.turbo/
.env
.env.*
!.env.example
*.tsbuildinfo
coverage/
```

- [ ] **Step 4: Create `.env.example` and the CI workflow**

Create `.env.example` (the contract a new dev fills in; consumed by `@planr/config` in Task 2):

```bash
# Database (Neon Postgres) — wired live in Plan 2
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Auth (Clerk) — wired live in Plan 2
CLERK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_WEBHOOK_SECRET="whsec_xxx"

# Billing (Stripe) — wired live in Plan 3
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Observability (optional)
SENTRY_DSN=""

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
```

- [ ] **Step 5: Install and verify the empty workspace is green**

Run:
```bash
pnpm install
pnpm lint
```
Expected: `pnpm install` completes and writes `pnpm-lock.yaml`; `pnpm lint` exits 0 (no files to lint yet, no errors).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json vitest.workspace.ts eslint.config.mjs .gitignore .env.example .github/workflows/ci.yml
git commit -m "chore: scaffold pnpm+turborepo monorepo with CI gates"
```

---

## Task 2: `@planr/config` — zod-validated environment

**Files:**
- Create: `packages/config/package.json`, `packages/config/tsconfig.json`, `packages/config/src/env.ts`, `packages/config/src/index.ts`
- Test: `packages/config/src/env.test.ts`

- [ ] **Step 1: Create the package manifest and tsconfig**

Create `packages/config/package.json`:

```json
{
  "name": "@planr/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": { "zod": "^3.23.0" }
}
```

Create `packages/config/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 2: Write the failing test**

Create `packages/config/src/env.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://u:p@h/db?sslmode=require",
  CLERK_SECRET_KEY: "sk_test_1",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_1",
  CLERK_WEBHOOK_SECRET: "whsec_1",
  STRIPE_SECRET_KEY: "sk_test_2",
  STRIPE_WEBHOOK_SECRET: "whsec_2",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("returns a typed config for valid input", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.SENTRY_DSN).toBeUndefined();
  });

  it("throws a clear error listing every missing required key", () => {
    expect(() => parseEnv({})).toThrowError(/DATABASE_URL/);
  });

  it("rejects a non-URL DATABASE_URL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "not-a-url" })).toThrowError(
      /DATABASE_URL/,
    );
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @planr/config test`
Expected: FAIL — cannot find module `./env`.

- [ ] **Step 4: Implement `env.ts`**

Create `packages/config/src/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const keys = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration. Check: ${keys}`);
  }
  return result.data;
}
```

Create `packages/config/src/index.ts`:

```ts
export { parseEnv, type Env } from "./env";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @planr/config test`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/config pnpm-lock.yaml
git commit -m "feat(config): zod-validated environment schema with fail-fast parseEnv"
```

---

## Task 3: `@planr/db` — Prisma schema for the tenancy + event spine

**Files:**
- Create: `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/prisma/schema.prisma`, `packages/db/src/index.ts`

> No live database is required in this plan. We author the schema, run `prisma validate` and `prisma generate`. Live migration against Neon is Plan 2.

- [ ] **Step 1: Create the package manifest and tsconfig**

Create `packages/db/package.json`:

```json
{
  "name": "@planr/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "db:validate": "prisma validate --schema prisma/schema.prisma",
    "db:generate": "prisma generate --schema prisma/schema.prisma"
  },
  "dependencies": { "@prisma/client": "^6.1.0" },
  "devDependencies": { "prisma": "^6.1.0" }
}
```

Create `packages/db/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 2: Author the schema**

Create `packages/db/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  owner
  admin
  planner
  editor
  viewer
}

enum SubscriptionStatus {
  trialing
  active
  past_due
  canceled
}

model User {
  id          String       @id @default(uuid())
  clerkUserId String       @unique
  email       String       @unique
  name        String?
  createdAt   DateTime     @default(now())
  memberships Membership[]
}

model Organization {
  id            String         @id @default(uuid())
  clerkOrgId    String         @unique
  name          String
  createdAt     DateTime       @default(now())
  memberships   Membership[]
  events        Event[]
  subscriptions Subscription[]
  entitlements  Entitlement[]
}

model Membership {
  id             String       @id @default(uuid())
  organizationId String
  userId         String
  role           Role         @default(viewer)
  createdAt      DateTime     @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}

model Event {
  id             String        @id @default(uuid())
  organizationId String
  eventTypeKey   String // resolves against @planr/core event-type registry; NOT a DB enum
  name           String
  date           DateTime?
  createdAt      DateTime      @default(now())
  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  entitlements   Entitlement[]

  @@index([organizationId])
  @@index([organizationId, eventTypeKey])
}

model Subscription {
  id                   String             @id @default(uuid())
  organizationId       String
  stripeSubscriptionId String?            @unique
  planKey              String // resolves against the billing plan registry (Plan 3)
  status               SubscriptionStatus @default(trialing)
  currentPeriodEnd     DateTime?
  createdAt            DateTime           @default(now())
  organization         Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}

model Entitlement {
  id             String       @id @default(uuid())
  organizationId String
  eventId        String? // null = org-level grant (e.g. all_access); set = event-scoped grant
  key            String // event_type:<key> | module:<key> | all_access
  source         String // planKey or purchase id that granted it
  createdAt      DateTime     @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  event          Event?       @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([organizationId, eventId, key])
  @@index([organizationId])
  @@index([eventId])
}
```

- [ ] **Step 3: Create the single legal Prisma export site**

Create `packages/db/src/index.ts`:

```ts
import { PrismaClient } from "./generated/client";

export { PrismaClient };
export const prisma = new PrismaClient();
```

- [ ] **Step 4: Validate and generate**

Run:
```bash
pnpm --filter @planr/db db:validate
pnpm --filter @planr/db db:generate
```
Expected: `db:validate` prints "The schema is valid"; `db:generate` writes the client to `packages/db/src/generated/client`.

- [ ] **Step 5: Commit**

```bash
git add packages/db pnpm-lock.yaml
git commit -m "feat(db): Prisma schema for organization, membership, event, subscription, entitlement"
```

---

## Task 4: `@planr/core` types + event-type registry

**Files:**
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/types.ts`, `packages/core/src/event-types/registry.ts`, `packages/core/src/index.ts`
- Test: `packages/core/src/event-types/registry.test.ts`

- [ ] **Step 1: Create the package manifest, tsconfig, and shared types**

Create `packages/core/package.json`:

```json
{
  "name": "@planr/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

Create `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

Create `packages/core/src/types.ts`:

```ts
export type EventTypeKey =
  | "wedding"
  | "birthday"
  | "funeral"
  | "bridal_shower"
  | "corporate";

export type ModuleKey =
  | "guests"
  | "venue"
  | "vendors"
  | "vendor_matching"
  | "budget"
  | "tasks"
  | "rsvp"
  | "messaging"
  | "seating"
  | "gift_registry"
  | "agenda"
  | "order_of_service";

export type ModuleTier = "core" | "advanced";

export type Role = "owner" | "admin" | "planner" | "editor" | "viewer";

export type Permission =
  | "org:delete"
  | "billing:manage"
  | "member:invite"
  | "member:remove"
  | "event:create"
  | "event:update"
  | "event:delete"
  | "content:edit"
  | "content:view";

export type Entitlement =
  | `event_type:${EventTypeKey}`
  | `module:${ModuleKey}`
  | "all_access";

export interface EventTypeProfile {
  key: EventTypeKey;
  label: string;
  modules: ModuleKey[];
  terminology: Record<string, string>;
  guestGroupings: string[];
  defaultVendorCategories: string[];
}
```

- [ ] **Step 2: Write the failing test**

Create `packages/core/src/event-types/registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getEventTypeProfile, eventTypeProfiles } from "./registry";

describe("event-type registry", () => {
  it("registers the wedding profile with shared + wedding-specific modules", () => {
    const wedding = getEventTypeProfile("wedding");
    expect(wedding.label).toBe("Wedding");
    expect(wedding.modules).toContain("guests");
    expect(wedding.modules).toContain("seating");
    expect(wedding.modules).toContain("gift_registry");
  });

  it("uses configurable guest groupings, never a hardcoded bride/groom Side", () => {
    const wedding = getEventTypeProfile("wedding");
    expect(wedding.guestGroupings.length).toBeGreaterThan(0);
    expect(wedding.terminology).not.toHaveProperty("bride");
  });

  it("throws for an unregistered event type", () => {
    // @ts-expect-error intentionally invalid key
    expect(() => getEventTypeProfile("gala")).toThrowError(/not registered/);
  });

  it("only registers wedding in this phase", () => {
    expect(Object.keys(eventTypeProfiles)).toEqual(["wedding"]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./registry`.

- [ ] **Step 4: Implement the registry**

Create `packages/core/src/event-types/registry.ts`:

```ts
import type { EventTypeKey, EventTypeProfile } from "../types";

const wedding: EventTypeProfile = {
  key: "wedding",
  label: "Wedding",
  modules: [
    "guests",
    "venue",
    "vendors",
    "vendor_matching",
    "budget",
    "tasks",
    "rsvp",
    "messaging",
    "seating",
    "gift_registry",
  ],
  terminology: { party: "Wedding party", host: "Couple" },
  guestGroupings: ["Partner A", "Partner B", "Shared"],
  defaultVendorCategories: ["photographer", "caterer", "sound", "florist", "venue"],
};

export const eventTypeProfiles: Partial<Record<EventTypeKey, EventTypeProfile>> = {
  wedding,
};

export function getEventTypeProfile(key: EventTypeKey): EventTypeProfile {
  const profile = eventTypeProfiles[key];
  if (!profile) {
    throw new Error(`Event type "${key}" is not registered.`);
  }
  return profile;
}
```

Create `packages/core/src/index.ts`:

```ts
export * from "./types";
export { eventTypeProfiles, getEventTypeProfile } from "./event-types/registry";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @planr/core test`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): event-type registry with wedding profile (no hardcoded Side)"
```

---

## Task 5: `@planr/core` capability / module registry

**Files:**
- Create: `packages/core/src/capabilities/registry.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/capabilities/registry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/capabilities/registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getModule, modulesForEventType, moduleDefinitions } from "./registry";

describe("capability registry", () => {
  it("classifies guests as a shared core module", () => {
    const guests = getModule("guests");
    expect(guests.tier).toBe("core");
    expect(guests.appliesTo).toBe("all");
  });

  it("classifies vendor_matching as an advanced module", () => {
    expect(getModule("vendor_matching").tier).toBe("advanced");
  });

  it("scopes gift_registry to wedding only", () => {
    const reg = getModule("gift_registry");
    expect(reg.appliesTo).toEqual(["wedding"]);
  });

  it("returns every module relevant to a wedding (shared + wedding-scoped)", () => {
    const keys = modulesForEventType("wedding").map((m) => m.key);
    expect(keys).toContain("guests"); // shared
    expect(keys).toContain("gift_registry"); // wedding-scoped
    expect(keys).not.toContain("agenda"); // corporate-scoped
  });

  it("defines every ModuleKey exactly once", () => {
    expect(Object.keys(moduleDefinitions).length).toBe(12);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./registry`.

- [ ] **Step 3: Implement the capability registry**

Create `packages/core/src/capabilities/registry.ts`:

```ts
import type { EventTypeKey, ModuleKey, ModuleTier } from "../types";

export interface ModuleDefinition {
  key: ModuleKey;
  tier: ModuleTier;
  appliesTo: EventTypeKey[] | "all";
}

function def(
  key: ModuleKey,
  tier: ModuleTier,
  appliesTo: EventTypeKey[] | "all",
): ModuleDefinition {
  return { key, tier, appliesTo };
}

export const moduleDefinitions: Record<ModuleKey, ModuleDefinition> = {
  guests: def("guests", "core", "all"),
  venue: def("venue", "core", "all"),
  vendors: def("vendors", "core", "all"),
  budget: def("budget", "core", "all"),
  tasks: def("tasks", "core", "all"),
  rsvp: def("rsvp", "core", "all"),
  messaging: def("messaging", "core", "all"),
  seating: def("seating", "core", ["wedding", "corporate", "bridal_shower", "birthday"]),
  vendor_matching: def("vendor_matching", "advanced", "all"),
  gift_registry: def("gift_registry", "advanced", ["wedding"]),
  agenda: def("agenda", "core", ["corporate"]),
  order_of_service: def("order_of_service", "core", ["funeral"]),
};

export function getModule(key: ModuleKey): ModuleDefinition {
  return moduleDefinitions[key];
}

export function modulesForEventType(eventType: EventTypeKey): ModuleDefinition[] {
  return Object.values(moduleDefinitions).filter(
    (m) => m.appliesTo === "all" || m.appliesTo.includes(eventType),
  );
}
```

- [ ] **Step 4: Re-export from the package index**

Modify `packages/core/src/index.ts` — append:

```ts
export {
  moduleDefinitions,
  getModule,
  modulesForEventType,
  type ModuleDefinition,
} from "./capabilities/registry";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @planr/core test`
Expected: PASS (capability suite + the prior event-type suite).

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): capability/module registry (shared vs type-scoped, core vs advanced)"
```

---

## Task 6: `@planr/core` entitlement / module-access resolver

This is the centerpiece — the spec's "a module renders ⟺ relevant-to-type AND entitled" rule, enforced as one deterministic function.

**Files:**
- Create: `packages/core/src/entitlements/resolver.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/entitlements/resolver.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/entitlements/resolver.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveModuleAccess } from "./resolver";

describe("resolveModuleAccess", () => {
  it("hides a module not relevant to the event type", () => {
    const r = resolveModuleAccess({
      module: "gift_registry",
      eventType: "funeral",
      held: ["all_access"],
    });
    expect(r.visible).toBe(false);
  });

  it("unlocks any relevant module when all_access is held", () => {
    const r = resolveModuleAccess({
      module: "vendor_matching",
      eventType: "wedding",
      held: ["all_access"],
    });
    expect(r).toMatchObject({ visible: true, locked: false });
  });

  it("unlocks a free-baseline core module with no entitlements", () => {
    const r = resolveModuleAccess({
      module: "guests",
      eventType: "wedding",
      held: [],
    });
    expect(r).toMatchObject({ visible: true, locked: false, reason: "free" });
  });

  it("locks a non-baseline core module until the event-type plan is held", () => {
    const locked = resolveModuleAccess({
      module: "seating",
      eventType: "wedding",
      held: [],
    });
    expect(locked).toMatchObject({ visible: true, locked: true, reason: "needs_event_type_plan" });

    const unlocked = resolveModuleAccess({
      module: "seating",
      eventType: "wedding",
      held: ["event_type:wedding"],
    });
    expect(unlocked.locked).toBe(false);
  });

  it("locks an advanced module until its module entitlement is held", () => {
    const locked = resolveModuleAccess({
      module: "vendor_matching",
      eventType: "wedding",
      held: ["event_type:wedding"],
    });
    expect(locked).toMatchObject({ visible: true, locked: true, reason: "needs_pro" });

    const unlocked = resolveModuleAccess({
      module: "vendor_matching",
      eventType: "wedding",
      held: ["module:vendor_matching"],
    });
    expect(unlocked.locked).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./resolver`.

- [ ] **Step 3: Implement the resolver**

Create `packages/core/src/entitlements/resolver.ts`:

```ts
import type { EventTypeKey, ModuleKey, Entitlement } from "../types";
import { getModule, modulesForEventType } from "../capabilities/registry";

// Core modules available for free (capped at the UI/service layer) to drive conversion.
export const FREE_BASELINE_MODULES: ModuleKey[] = ["guests", "tasks", "budget"];

export type AccessReason =
  | "all_access"
  | "free"
  | "entitled"
  | "needs_event_type_plan"
  | "needs_pro"
  | "not_relevant";

export interface ModuleAccess {
  visible: boolean;
  locked: boolean;
  reason: AccessReason;
}

export interface ResolveInput {
  module: ModuleKey;
  eventType: EventTypeKey;
  held: Entitlement[];
}

export function resolveModuleAccess({ module, eventType, held }: ResolveInput): ModuleAccess {
  const relevant = modulesForEventType(eventType).some((m) => m.key === module);
  if (!relevant) {
    return { visible: false, locked: true, reason: "not_relevant" };
  }

  if (held.includes("all_access")) {
    return { visible: true, locked: false, reason: "all_access" };
  }

  const def = getModule(module);

  if (def.tier === "core") {
    if (held.includes(`event_type:${eventType}`)) {
      return { visible: true, locked: false, reason: "entitled" };
    }
    if (FREE_BASELINE_MODULES.includes(module)) {
      return { visible: true, locked: false, reason: "free" };
    }
    return { visible: true, locked: true, reason: "needs_event_type_plan" };
  }

  // advanced
  if (held.includes(`module:${module}`)) {
    return { visible: true, locked: false, reason: "entitled" };
  }
  return { visible: true, locked: true, reason: "needs_pro" };
}
```

- [ ] **Step 4: Re-export from the package index**

Modify `packages/core/src/index.ts` — append:

```ts
export {
  resolveModuleAccess,
  FREE_BASELINE_MODULES,
  type ModuleAccess,
  type AccessReason,
  type ResolveInput,
} from "./entitlements/resolver";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @planr/core test`
Expected: PASS (resolver suite + prior suites).

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): entitlement resolver enforcing relevant-AND-entitled module access"
```

---

## Task 7: `@planr/core` RBAC policy

**Files:**
- Create: `packages/core/src/rbac/policy.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/rbac/policy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/rbac/policy.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { roleHasPermission, permissionsForRole } from "./policy";

describe("RBAC policy", () => {
  it("grants the owner every permission, including org:delete and billing", () => {
    expect(roleHasPermission("owner", "org:delete")).toBe(true);
    expect(roleHasPermission("owner", "billing:manage")).toBe(true);
  });

  it("lets an admin manage members but never delete the org", () => {
    expect(roleHasPermission("admin", "member:invite")).toBe(true);
    expect(roleHasPermission("admin", "org:delete")).toBe(false);
  });

  it("lets a planner edit content and manage events but not members or billing", () => {
    expect(roleHasPermission("planner", "content:edit")).toBe(true);
    expect(roleHasPermission("planner", "event:create")).toBe(true);
    expect(roleHasPermission("planner", "member:invite")).toBe(false);
    expect(roleHasPermission("planner", "billing:manage")).toBe(false);
  });

  it("lets an editor edit content but not delete events", () => {
    expect(roleHasPermission("editor", "content:edit")).toBe(true);
    expect(roleHasPermission("editor", "event:delete")).toBe(false);
  });

  it("restricts a viewer to read-only", () => {
    expect(permissionsForRole("viewer")).toEqual(["content:view"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./policy`.

- [ ] **Step 3: Implement the policy**

Create `packages/core/src/rbac/policy.ts`:

```ts
import type { Role, Permission } from "../types";

const ALL: Permission[] = [
  "org:delete",
  "billing:manage",
  "member:invite",
  "member:remove",
  "event:create",
  "event:update",
  "event:delete",
  "content:edit",
  "content:view",
];

const rolePermissions: Record<Role, Permission[]> = {
  owner: ALL,
  admin: ALL.filter((p) => p !== "org:delete"),
  planner: ["event:create", "event:update", "event:delete", "content:edit", "content:view"],
  editor: ["event:update", "content:edit", "content:view"],
  viewer: ["content:view"],
};

export function permissionsForRole(role: Role): Permission[] {
  return rolePermissions[role];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
```

- [ ] **Step 4: Re-export from the package index**

Modify `packages/core/src/index.ts` — append:

```ts
export { roleHasPermission, permissionsForRole } from "./rbac/policy";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @planr/core test`
Expected: PASS (RBAC suite + prior suites).

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): role-to-permission RBAC matrix"
```

---

## Task 8: Enforce the architectural boundary (no Prisma outside `@planr/db`)

**Files:**
- Modify: `eslint.config.mjs`
- Create: `packages/eslint-fixtures/illegal-prisma-import.ts`

- [ ] **Step 1: Add the boundary rule to ESLint**

Modify `eslint.config.mjs` to add a config block AFTER the recommended spread:

```js
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/generated/**"],
  },
  ...tseslint.configs.recommended,
  {
    // Architectural boundary: Prisma may only be imported inside @planr/db.
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["packages/db/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message: "Import Prisma only inside @planr/db. Use a repository instead.",
            },
          ],
          patterns: [
            {
              group: ["**/generated/client", "@planr/db/**/generated/**"],
              message: "Do not reach into @planr/db internals. Import from @planr/db.",
            },
          ],
        },
      ],
    },
  },
);
```

- [ ] **Step 2: Create a fixture that violates the rule**

Create `packages/eslint-fixtures/illegal-prisma-import.ts`:

```ts
// This file exists ONLY to prove the boundary rule fires. It must always lint-error.
import { PrismaClient } from "@prisma/client";

export const leak = new PrismaClient();
```

- [ ] **Step 3: Verify the rule fires on the fixture**

Run: `pnpm exec eslint packages/eslint-fixtures/illegal-prisma-import.ts`
Expected: FAIL (exit 1) with the message "Import Prisma only inside @planr/db."

- [ ] **Step 4: Verify legitimate db usage is allowed**

Run: `pnpm exec eslint packages/db/src/index.ts`
Expected: PASS (exit 0) — the rule ignores `packages/db/**`.

- [ ] **Step 5: Exclude the fixture from the repo-wide lint gate**

Modify the `ignores` array in the FIRST config block of `eslint.config.mjs` to add the fixtures dir, so `pnpm lint` stays green while the fixture remains available for the manual check above:

```js
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/generated/**", "packages/eslint-fixtures/**"],
  },
```

- [ ] **Step 6: Verify the repo-wide gate is green**

Run: `pnpm lint`
Expected: PASS (exit 0).

- [ ] **Step 7: Commit**

```bash
git add eslint.config.mjs packages/eslint-fixtures
git commit -m "feat(lint): enforce Prisma-only-in-@planr/db architectural boundary"
```

---

## Task 9: Full monorepo green-gate verification

**Files:** none (verification + wiring check)

- [ ] **Step 1: Add `typecheck` scripts where missing and confirm Turbo discovers them**

Confirm each package's `package.json` has a `typecheck` script (config: yes, core: yes, db: yes). For `@planr/db`, typecheck depends on the generated client — ensure it was generated in Task 3 Step 4. If not, run `pnpm --filter @planr/db db:generate`.

- [ ] **Step 2: Run the full gate exactly as CI will**

Run:
```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
```
Expected: all three exit 0. `pnpm test` reports the config suite (3) + core suites (event-types 4, capabilities 5, resolver 6, rbac 5).

- [ ] **Step 3: Commit any lockfile/script adjustments**

```bash
git add -A
git commit -m "chore: confirm monorepo typecheck/lint/test gate is green"
```

- [ ] **Step 4: Open the PR for Plan 1**

```bash
git push -u origin foundation-redesign
gh pr create --title "Foundation Core: monorepo + db schema + domain engines" \
  --body "Implements docs/superpowers/plans/2026-06-04-planr-foundation-core.md. CI gates green; entitlement resolver, capability + event-type registries, and RBAC fully unit-tested."
```

---

## Self-review (completed against the spec)

**Spec coverage:**
- §4.1 monorepo shape → Task 1 (+ config/db/core packages in Tasks 2–7). *Note: `@planr/auth`, `@planr/billing`, `@planr/ui`, `apps/web` are intentionally deferred to Plans 2–3; this plan is the offline core.*
- §4.2 layering + Prisma boundary → Task 8 (lint-enforced).
- §5 tenancy/event schema, `organizationId` indexes, no `Side` → Task 3 + Task 4.
- §6 event-type polymorphism (registry, configurable groupings) → Task 4.
- §7.1 two-registry rule, §7.2 entitlement engine, free baseline → Tasks 5 + 6.
- §8 RBAC role→permission → Task 7.
- §9 env fail-fast → Task 2; test harness/CI gates → Tasks 1 & 9.
- §13 success criteria (green CI, no Prisma outside db, second event type = registry-only) → Tasks 6, 8, 9 (the resolver/registries take `eventType` data-drivenly; adding one is a registry edit).

**Deferred to later plans (by design, stated in spec §11):** Clerk auth wiring, Stripe billing, tRPC/REST surfaces, repository implementations, live Neon migration, web app + E2E. Each is its own plan.

**Placeholder scan:** none — every code/test step contains complete content.

**Type consistency:** `EventTypeKey`, `ModuleKey`, `ModuleTier`, `Role`, `Permission`, `Entitlement` defined once in `types.ts` (Task 4) and reused verbatim in Tasks 5–7. `resolveModuleAccess` signature and `ModuleAccess.reason` values match between the resolver (Task 6) and its test. `getModule`/`modulesForEventType` names are consistent across Tasks 5 and 6.
