# Planr Supabase Auth, Identity & tRPC API — Implementation Plan (Plan 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `apps/web` (Next.js) with Supabase Auth and a tRPC API that lets an authenticated user create an organization, create a wedding event, and read entitlement-gated modules — backed by the existing core services and Prisma adapters, with a provider-agnostic identity model and integration tests against the local Supabase Postgres. No browser UI yet (that is Plan 4).

**Architecture:** The lint boundary keeps `@planr/core` framework-free; `apps/web` is the composition root that builds the PrismaClient → repositories → services and exposes them through tRPC. Supabase Auth owns identity (the signed-in user's UUID); on each request we upsert that user into our `User` table and resolve their `Membership` rows for authorization. Organizations are **app-created** (no provider webhook), so the identity model drops Clerk-specific columns: `User.clerkUserId` → `User.authUserId`, and `Organization.clerkOrgId` is removed (orgs are identified by their own uuid). tRPC procedures enforce authorization via a new core authorization service (role → permission).

**Tech Stack:** Next.js 15 (App Router), `@supabase/ssr` + `@supabase/supabase-js`, tRPC v11 (`@trpc/server`/`@trpc/client`), Prisma 6 + Supabase Postgres, Vitest (unit + integration), the existing `@planr/core`/`@planr/db`/`@planr/config`.

**Reference spec:** `docs/superpowers/specs/2026-06-04-planr-foundation-design.md` (§5 tenancy, §7 entitlements, §8 auth — amended to Supabase).
**Builds on:** Plans 1-2 (branch `foundation-redesign`). Local Supabase is up via `supabase start` (DB `postgresql://postgres:postgres@127.0.0.1:54422/postgres`, API `http://127.0.0.1:54421`).

**Environment facts:** pnpm 10.32.1; local Supabase on the +100 port range; `TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres'` for integration tests; `prisma generate`/`migrate` need `DATABASE_URL` defined.

---

## Identity model change (applies across Tasks 1-3)

Plan 2 used Clerk-shaped natural keys. Under Supabase Auth the provider only knows *users*; orgs are ours. The new contract:

| Before (Clerk) | After (Supabase) |
|---|---|
| `User.clerkUserId @unique` | `User.authUserId @unique` (the Supabase auth UUID) |
| `Organization.clerkOrgId @unique` | _removed_ — org identity is its own `id` |
| `OrganizationRepository.upsertByClerkOrgId / findByClerkOrgId` | `OrganizationRepository.create / findById / listForUser` |
| `UserRepository.upsertByClerkUserId / findByClerkUserId` | `UserRepository.upsertByAuthUserId / findByAuthUserId` |
| `tenancy.provisionOrganization({clerkOrgId,name,creator})` | `tenancy.provisionOrganization({name, creator:{authUserId,email,name}})` |
| `makeClerkSync` (user/org/membership webhooks) | `syncAuthUser({authUserId,email,name})` only |

`MembershipRepository`, `EventRepository`, `EntitlementRepository`, the resolver, RBAC, and event/entitlement services are unaffected (they key on internal ids).

---

## File structure (locked)

```
packages/config/src/env.ts                       # Supabase keys (Task 1)
packages/db/prisma/schema.prisma                 # authUserId; drop clerkOrgId (Task 2)
packages/db/prisma/migrations/<ts>_provider_agnostic_identity/   (Task 2)
packages/core/src/ports/repositories.ts          # renamed methods/records (Task 3)
packages/core/src/testing/fakes.ts               # match new ports (Task 3)
packages/core/src/services/tenancy.service.ts    # provisionOrganization (Task 3)
packages/core/src/sync/auth-sync.ts              # syncAuthUser (replaces clerk-sync) (Task 3)
packages/core/src/services/authorization.service.ts   # requireMembership/requirePermission (Task 4)
packages/db/src/repositories/{organization,user}.repository.ts   # match new ports (Task 3)
apps/web/                                         # Next.js app (Tasks 5-9)
  package.json, next.config.ts, tsconfig.json, next-env.d.ts
  src/env.ts                                      # parsed env (Task 5)
  src/lib/supabase/server.ts                      # SSR server client (Task 6)
  middleware.ts                                   # Supabase session refresh (Task 6)
  src/server/container.ts                         # prisma+repos+services composition root (Task 7)
  src/server/auth.ts                              # currentAuthUser() + syncAuthUser glue (Task 7)
  src/server/trpc.ts                              # tRPC init + context + authedProcedure (Task 8)
  src/server/routers/app.ts                       # org/event/me procedures (Task 8)
  src/server/routers/app.int.test.ts             # integration tests vs Supabase (Task 8)
  src/app/api/trpc/[trpc]/route.ts                # tRPC HTTP handler (Task 9)
  src/app/layout.tsx, src/app/page.tsx            # minimal authed server page (Task 9)
.github/workflows/ci.yml                          # web typecheck (Task 9)
```

---

## Task 1: `@planr/config` — Supabase env schema

**Files:** Modify `packages/config/src/env.ts`; Test `packages/config/src/env.test.ts`.

- [ ] **Step 1: Rewrite the test for Supabase keys**

Replace `packages/config/src/env.test.ts` with:
```ts
import { describe, it, expect } from "vitest";
import { parseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54422/postgres",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54421",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
  SUPABASE_SECRET_KEY: "sb_secret_x",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("returns a typed config for valid input", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(valid.NEXT_PUBLIC_SUPABASE_URL);
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
  });

  it("throws a clear error naming missing keys", () => {
    expect(() => parseEnv({})).toThrowError(/DATABASE_URL/);
  });

  it("rejects a non-URL Supabase URL", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "nope" })).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

Run: `pnpm --filter @planr/config test` → fails (schema still expects Clerk keys).

- [ ] **Step 3: Rewrite the schema**

Replace `packages/config/src/env.ts` with:
```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  // Billing — added in the Billing plan; optional until then.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
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

- [ ] **Step 4: Run, confirm PASS + typecheck**

Run: `pnpm --filter @planr/config test` → 3 pass; `pnpm --filter @planr/config typecheck` → 0.

- [ ] **Step 5: Commit**

```bash
git add packages/config
git commit -m "feat(config): replace Clerk env vars with Supabase (Stripe now optional)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Provider-agnostic identity migration

**Files:** Modify `packages/db/prisma/schema.prisma`; create a migration.

- [ ] **Step 1: Edit the schema — User.authUserId and drop Organization.clerkOrgId**

In `packages/db/prisma/schema.prisma`:
- In `model User`, rename `clerkUserId String @unique` to `authUserId String @unique`.
- In `model Organization`, DELETE the line `clerkOrgId String @unique` (keep `id`, `name`, `createdAt`, relations, and the comment block on Entitlement is unrelated).

Resulting `User` and `Organization`:
```prisma
model User {
  id          String       @id @default(uuid())
  authUserId  String       @unique
  email       String       @unique
  name        String?
  createdAt   DateTime     @default(now())
  memberships Membership[]
}

model Organization {
  id            String         @id @default(uuid())
  name          String
  createdAt     DateTime       @default(now())
  memberships   Membership[]
  events        Event[]
  subscriptions Subscription[]
  entitlements  Entitlement[]
}
```

- [ ] **Step 2: Generate the migration against local Supabase**

Run (Supabase must be running):
```bash
cd /Users/papii/Planr
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' \
  pnpm --filter @planr/db exec prisma migrate dev --name provider_agnostic_identity --skip-generate 2>&1 | tail -8
```
Expected: a new `migrations/<ts>_provider_agnostic_identity/migration.sql` that drops `Organization.clerkOrgId` (and its unique index) and renames/replaces `User.clerkUserId` with `authUserId`. (Prisma may emit DROP+ADD for the rename — acceptable, there is no real data.)

- [ ] **Step 3: Verify it deploys clean on a fresh DB and regenerate the client**

Run:
```bash
createdb -h 127.0.0.1 -p 54422 -U postgres planr_verify2 2>/dev/null || true
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/planr_verify2' pnpm --filter @planr/db exec prisma migrate deploy --schema prisma/schema.prisma 2>&1 | tail -4
dropdb -h 127.0.0.1 -p 54422 -U postgres planr_verify2 2>/dev/null || true
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null && echo "client regenerated"
```
Expected: "All migrations have been successfully applied"; client regenerated.

- [ ] **Step 4: Commit (schema + migration only; @planr/db will not typecheck until Task 3 updates the adapters — that's expected and fixed next)**

```bash
git add packages/db/prisma
git commit -m "feat(db): provider-agnostic identity migration (User.authUserId, drop Organization.clerkOrgId)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Update core ports/fakes/services + db adapters for the new identity model

This is a coordinated rename across `@planr/core` and `@planr/db`. The test suites are the gate — keep them green.

**Files:**
- Modify: `packages/core/src/ports/repositories.ts`, `packages/core/src/testing/fakes.ts`, `packages/core/src/services/tenancy.service.ts`, `packages/core/src/index.ts`
- Create: `packages/core/src/sync/auth-sync.ts`, `packages/core/src/sync/auth-sync.test.ts`
- Delete: `packages/core/src/sync/clerk-sync.ts`, `packages/core/src/sync/clerk-sync.test.ts`
- Modify: `packages/db/src/repositories/organization.repository.ts`, `packages/db/src/repositories/user.repository.ts`, `packages/db/src/repositories/repositories.int.test.ts`, `packages/db/src/flow.int.test.ts`
- Modify Plan-2 tests that reference old names: `packages/core/src/testing/fakes.test.ts`, `packages/core/src/services/tenancy.service.test.ts`

- [ ] **Step 1: Update the ports**

In `packages/core/src/ports/repositories.ts`:
- `UserRecord`: rename field `clerkUserId` → `authUserId`.
- Remove `clerkOrgId` from `OrganizationRecord` (keep `id`, `name`).
- `OrganizationRepository` becomes:
```ts
export interface OrganizationRepository {
  create(input: { name: string }): Promise<OrganizationRecord>;
  findById(id: string): Promise<OrganizationRecord | null>;
  listForUser(userId: string): Promise<OrganizationRecord[]>;
}
```
- `UserRepository` becomes:
```ts
export interface UserRepository {
  upsertByAuthUserId(input: {
    authUserId: string;
    email: string;
    name: string | null;
  }): Promise<UserRecord>;
  findByAuthUserId(authUserId: string): Promise<UserRecord | null>;
}
```
Leave `OrganizationRecord` as `{ id: string; name: string }`, `MembershipRepository`/`EventRepository`/`EntitlementRepository`/`Repositories` unchanged.

- [ ] **Step 2: Update the fakes to match**

In `packages/core/src/testing/fakes.ts`:
- `orgs`: replace `upsertByClerkOrgId`/`findByClerkOrgId` with:
```ts
    orgs: {
      async create({ name }) {
        const created: OrganizationRecord = { id: id("org"), name };
        orgs.push(created);
        return { ...created };
      },
      async findById(orgId) {
        const found = orgs.find((o) => o.id === orgId);
        return found ? { ...found } : null;
      },
      async listForUser(userId) {
        const orgIds = new Set(
          memberships.filter((m) => m.userId === userId).map((m) => m.organizationId),
        );
        return orgs.filter((o) => orgIds.has(o.id)).map((o) => ({ ...o }));
      },
    },
```
- `users`: rename to `upsertByAuthUserId`/`findByAuthUserId` and use `authUserId` in the record (replace every `clerkUserId` with `authUserId`).
- Remove `clerkOrgId` from the `OrganizationRecord` literal.

- [ ] **Step 3: Update fakes.test.ts and tenancy.service + its test**

In `packages/core/src/testing/fakes.test.ts`: replace the org-upsert test with a create+listForUser test:
```ts
  it("creates organizations and lists them for a member", async () => {
    const { orgs, users, memberships } = makeFakeRepositories();
    const org = await orgs.create({ name: "Smith Wedding" });
    const user = await users.upsertByAuthUserId({ authUserId: "auth_1", email: "a@b.com", name: "Ada" });
    await memberships.upsert({ organizationId: org.id, userId: user.id, role: "owner" });
    expect(await orgs.findById(org.id)).toMatchObject({ name: "Smith Wedding" });
    expect(await orgs.listForUser(user.id)).toHaveLength(1);
  });
```
Keep the membership and entitlement tests (they don't reference org/user natural keys, except update the entitlement test's unchanged calls — they use organizationId strings, fine).

In `packages/core/src/services/tenancy.service.ts`, change `provisionOrganization`:
```ts
import type { Repositories, OrganizationRecord, MembershipRecord } from "../ports/repositories";
import type { Role } from "../types";

interface AuthUserInput {
  authUserId: string;
  email: string;
  name: string | null;
}

export function makeTenancyService(repos: Repositories) {
  return {
    async provisionOrganization(input: {
      name: string;
      creator: AuthUserInput;
    }): Promise<{ organization: OrganizationRecord; ownerMembership: MembershipRecord }> {
      const organization = await repos.orgs.create({ name: input.name });
      const owner = await repos.users.upsertByAuthUserId(input.creator);
      const ownerMembership = await repos.memberships.upsert({
        organizationId: organization.id,
        userId: owner.id,
        role: "owner",
      });
      return { organization, ownerMembership };
    },

    async addMember(input: {
      organizationId: string;
      user: AuthUserInput;
      role: Role;
    }): Promise<MembershipRecord> {
      const user = await repos.users.upsertByAuthUserId(input.user);
      return repos.memberships.upsert({
        organizationId: input.organizationId,
        userId: user.id,
        role: input.role,
      });
    },
  };
}

export type TenancyService = ReturnType<typeof makeTenancyService>;
```
In `packages/core/src/services/tenancy.service.test.ts`, update every `clerkOrgId: "org_1"` provisioning call to `{ name: "Smith Wedding", creator: { authUserId: "auth_1", email: "a@b.com", name: "Ada" } }` and drop assertions on `organization.clerkOrgId` (assert `organization.name` instead). The idempotency test no longer applies (orgs aren't keyed by external id) — replace it with: "two provision calls create two distinct orgs" asserting `first.organization.id !== second.organization.id`.

- [ ] **Step 4: Replace clerk-sync with auth-sync**

Delete `packages/core/src/sync/clerk-sync.ts` and `clerk-sync.test.ts`. Create `packages/core/src/sync/auth-sync.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { syncAuthUser } from "./auth-sync";

describe("syncAuthUser", () => {
  it("upserts the authenticated user into our User table", async () => {
    const repos = makeFakeRepositories();
    const user = await syncAuthUser(repos, { authUserId: "auth_9", email: "z@x.com", name: "Zed" });
    expect(user).toMatchObject({ authUserId: "auth_9", email: "z@x.com" });
    expect(await repos.users.findByAuthUserId("auth_9")).toMatchObject({ id: user.id });
  });

  it("is idempotent and updates email/name on repeat", async () => {
    const repos = makeFakeRepositories();
    const a = await syncAuthUser(repos, { authUserId: "auth_9", email: "z@x.com", name: "Zed" });
    const b = await syncAuthUser(repos, { authUserId: "auth_9", email: "z2@x.com", name: "Zed II" });
    expect(b.id).toBe(a.id);
    expect(b.email).toBe("z2@x.com");
  });
});
```
Create `packages/core/src/sync/auth-sync.ts`:
```ts
import type { Repositories, UserRecord } from "../ports/repositories";

/** Maps a signed-in Supabase auth user to our internal User row (called per request). */
export async function syncAuthUser(
  repos: Repositories,
  input: { authUserId: string; email: string; name: string | null },
): Promise<UserRecord> {
  return repos.users.upsertByAuthUserId(input);
}
```

- [ ] **Step 5: Update the barrel**

In `packages/core/src/index.ts`: remove the `clerk-role`/`clerk-sync` exports for the removed sync, KEEP `mapClerkRole`? — it's unused under Supabase. Remove `export { mapClerkRole }` and delete `sync/clerk-role.ts` + its test as well (Supabase has no provider role string for orgs). Replace the sync export with:
```ts
export { syncAuthUser } from "./sync/auth-sync";
```
(So Task 3 also deletes `packages/core/src/sync/clerk-role.ts` and `clerk-role.test.ts`.)

- [ ] **Step 6: Update the db adapters**

`packages/db/src/repositories/organization.repository.ts`:
```ts
import type { OrganizationRepository, OrganizationRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { name: string }): Promise<OrganizationRecord> {
    const row = await this.prisma.organization.create({ data: { name: input.name } });
    return { id: row.id, name: row.name };
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const row = await this.prisma.organization.findUnique({ where: { id } });
    return row ? { id: row.id, name: row.name } : null;
  }

  async listForUser(userId: string): Promise<OrganizationRecord[]> {
    const rows = await this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({ id: row.id, name: row.name }));
  }
}
```
`packages/db/src/repositories/user.repository.ts`:
```ts
import type { UserRepository, UserRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByAuthUserId(input: {
    authUserId: string;
    email: string;
    name: string | null;
  }): Promise<UserRecord> {
    const row = await this.prisma.user.upsert({
      where: { authUserId: input.authUserId },
      create: { authUserId: input.authUserId, email: input.email, name: input.name },
      update: { email: input.email, name: input.name },
    });
    return { id: row.id, authUserId: row.authUserId, email: row.email, name: row.name };
  }

  async findByAuthUserId(authUserId: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { authUserId } });
    return row
      ? { id: row.id, authUserId: row.authUserId, email: row.email, name: row.name }
      : null;
  }
}
```

- [ ] **Step 7: Update the db integration tests**

In `packages/db/src/repositories/repositories.int.test.ts`: replace `upsertByClerkOrgId({clerkOrgId,name})` calls with `create({name})` (capture the returned org), `users.upsertByClerkUserId` → `upsertByAuthUserId({authUserId,...})`, and the "upserts organizations idempotently" test with a "create + findById + listForUser" test:
```ts
  it("creates organizations and lists them for a member", async () => {
    const org = await repos.orgs.create({ name: "Smith" });
    const user = await repos.users.upsertByAuthUserId({ authUserId: "auth_1", email: "a@b.com", name: "Ada" });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "owner" });
    expect(await repos.orgs.findById(org.id)).toMatchObject({ name: "Smith" });
    expect(await repos.orgs.listForUser(user.id)).toHaveLength(1);
  });
```
Keep the membership/event/entitlement/heldFor/partial-unique tests, changing any `upsertByClerkOrgId` to `create({name})` and `upsertByClerkUserId` to `upsertByAuthUserId`.

In `packages/db/src/flow.int.test.ts`: change `provisionOrganization({clerkOrgId,name,creator:{clerkUserId,...}})` → `provisionOrganization({ name, creator: { authUserId, email, name } })`; change the Clerk-sync test to use `syncAuthUser(repos, {...})` then assert the user is queryable (orgs/memberships are created via services, not sync):
```ts
  it("syncs a signed-in auth user into a queryable User row", async () => {
    const repos = createRepositories(db.prisma);
    const user = await syncAuthUser(repos, { authUserId: "auth_sync", email: "s@x.com", name: "S" });
    expect(await repos.users.findByAuthUserId("auth_sync")).toMatchObject({ id: user.id });
  });
```
(Import `syncAuthUser` from `@planr/core`; remove the `makeClerkSync` import.)

- [ ] **Step 8: Run everything green**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck 2>&1 | grep Tasks
pnpm lint; echo "lint=$?"
pnpm test 2>&1 | grep "Tests "
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
```
Expected: typecheck 3/3; lint=0; offline suite green (count will shift from 49 due to removed clerk-role/clerk-sync tests and changed tenancy tests — report the new number); integration 8 passing.

- [ ] **Step 9: Commit**

```bash
git add packages/core packages/db
git commit -m "refactor(core,db): provider-agnostic identity (authUserId, app-created orgs, syncAuthUser)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Authorization service in `@planr/core`

**Files:** Create `packages/core/src/services/authorization.service.ts` + `.test.ts`; modify `packages/core/src/index.ts`.

- [ ] **Step 1: Write the failing test**

`packages/core/src/services/authorization.service.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeAuthorizationService } from "./authorization.service";

async function seedMember(role: "owner" | "admin" | "planner" | "editor" | "viewer") {
  const repos = makeFakeRepositories();
  const org = await repos.orgs.create({ name: "Org" });
  const user = await repos.users.upsertByAuthUserId({ authUserId: "a1", email: "a@b.com", name: null });
  await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role });
  return { repos, org, user, authz: makeAuthorizationService(repos) };
}

describe("authorization service", () => {
  it("requireMembership returns the member's role", async () => {
    const { authz, org, user } = await seedMember("planner");
    expect(await authz.requireMembership(user.id, org.id)).toBe("planner");
  });

  it("requireMembership throws for a non-member", async () => {
    const { authz, org } = await seedMember("owner");
    await expect(authz.requireMembership("ghost", org.id)).rejects.toThrowError(/not a member/i);
  });

  it("requirePermission allows a planner to create events", async () => {
    const { authz, org, user } = await seedMember("planner");
    await expect(authz.requirePermission(user.id, org.id, "event:create")).resolves.toBe("planner");
  });

  it("requirePermission denies a viewer from creating events", async () => {
    const { authz, org, user } = await seedMember("viewer");
    await expect(
      authz.requirePermission(user.id, org.id, "event:create"),
    ).rejects.toThrowError(/forbidden/i);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

Run: `pnpm --filter @planr/core test` → fails (no `./authorization.service`).

- [ ] **Step 3: Implement**

`packages/core/src/services/authorization.service.ts`:
```ts
import type { Repositories } from "../ports/repositories";
import type { Role, Permission } from "../types";
import { roleHasPermission } from "../rbac/policy";

export function makeAuthorizationService(repos: Repositories) {
  return {
    async requireMembership(userId: string, organizationId: string): Promise<Role> {
      const membership = await repos.memberships.find({ organizationId, userId });
      if (!membership) {
        throw new Error(`User is not a member of organization "${organizationId}".`);
      }
      return membership.role;
    },

    async requirePermission(
      userId: string,
      organizationId: string,
      permission: Permission,
    ): Promise<Role> {
      const role = await this.requireMembership(userId, organizationId);
      if (!roleHasPermission(role, permission)) {
        throw new Error(`Forbidden: role "${role}" lacks permission "${permission}".`);
      }
      return role;
    },
  };
}

export type AuthorizationService = ReturnType<typeof makeAuthorizationService>;
```

- [ ] **Step 4: Barrel + run**

Append to `packages/core/src/index.ts`:
```ts
export {
  makeAuthorizationService,
  type AuthorizationService,
} from "./services/authorization.service";
```
Run `pnpm --filter @planr/core test` (4 new pass) and `pnpm --filter @planr/core typecheck` (0).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): authorization service (requireMembership / requirePermission)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Scaffold `apps/web` (Next.js)

**Files:** Create `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/next-env.d.ts`, `apps/web/src/env.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`.

- [ ] **Step 1: Manifest + deps**

`apps/web/package.json`:
```json
{
  "name": "@planr/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "typecheck": "tsc --noEmit",
    "test:int": "vitest run --config vitest.int.config.ts"
  },
  "dependencies": {
    "@planr/core": "workspace:*",
    "@planr/db": "workspace:*",
    "@planr/config": "workspace:*",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.45.0",
    "@trpc/client": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "superjson": "^2.2.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "vitest": "^2.1.0"
  }
}
```
Then `pnpm install` from the repo root.

- [ ] **Step 2: Next + TS config**

`apps/web/next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@planr/core", "@planr/db", "@planr/config"],
};

export default nextConfig;
```
`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "plugins": [{ "name": "next" }],
    "noEmit": true,
    "allowJs": true,
    "incremental": true
  },
  "include": ["next-env.d.ts", "src", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
`apps/web/next-env.d.ts`:
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 3: Parsed env + minimal layout/page**

`apps/web/src/env.ts`:
```ts
import { parseEnv } from "@planr/config";

export const env = parseEnv(process.env);
```
`apps/web/src/app/layout.tsx`:
```tsx
export const metadata = { title: "Planr" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```
`apps/web/src/app/page.tsx`:
```tsx
export default function Home() {
  return <main>Planr</main>;
}
```

- [ ] **Step 4: Typecheck**

Run:
```bash
cd /Users/papii/Planr
pnpm --filter @planr/web exec next telemetry disable >/dev/null 2>&1 || true
pnpm --filter @planr/web typecheck 2>&1 | tail -10; echo "tc=$?"
```
Expected: `tc=0`. (Next's `tsc --noEmit` needs `.next/types` only after a build for route types; with no typed routes yet it passes. If it complains about missing `.next/types`, run `pnpm --filter @planr/web exec next build --no-lint` once to generate types, or remove `.next/types/**/*.ts` from `include` until Task 9.)

- [ ] **Step 5: Keep it out of the unit workspace; commit**

The web app has only integration tests (Task 8), named `*.int.test.ts`, already excluded from `pnpm test`. No change to `vitest.workspace.ts` needed. Commit:
```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): scaffold Next.js app (@planr/web) with workspace deps

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Supabase SSR server client + session middleware

**Files:** Create `apps/web/src/lib/supabase/server.ts`, `apps/web/middleware.ts`.

- [ ] **Step 1: Server client (cookie-based, per request)**

`apps/web/src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../../env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component — safe to ignore; middleware refreshes the session
          }
        },
      },
    },
  );
}
```

- [ ] **Step 2: Session-refresh middleware**

`apps/web/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "./src/env";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 3: Typecheck + commit**

Run `pnpm --filter @planr/web typecheck; echo "tc=$?"` → 0. Commit:
```bash
git add apps/web/src/lib apps/web/middleware.ts
git commit -m "feat(web): Supabase SSR server client + session-refresh middleware

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Composition root + auth glue

**Files:** Create `apps/web/src/server/container.ts`, `apps/web/src/server/auth.ts`.

- [ ] **Step 1: Composition root (prisma → repos → services)**

`apps/web/src/server/container.ts`:
```ts
import { prisma } from "@planr/db";
import { createRepositories } from "@planr/db/src/repositories/index";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeAuthorizationService,
} from "@planr/core";

const repos = createRepositories(prisma);

export const container = {
  repos,
  tenancy: makeTenancyService(repos),
  events: makeEventService(repos),
  entitlements: makeEntitlementService(repos),
  authz: makeAuthorizationService(repos),
};

export type Container = typeof container;
```
> Note: importing `@planr/db/src/repositories/index` reaches a subpath. To keep imports clean, add a barrel export instead — in `packages/db/src/index.ts` append `export { createRepositories } from "./repositories/index";` and import `{ prisma, createRepositories }` from `@planr/db`. Do that, then use:
```ts
import { prisma, createRepositories } from "@planr/db";
```

- [ ] **Step 2: Auth glue — current user, synced**

`apps/web/src/server/auth.ts`:
```ts
import { syncAuthUser, type UserRecord } from "@planr/core";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { container } from "./container";

/** Returns the request's signed-in user as our internal User row, or null. */
export async function getCurrentUser(): Promise<UserRecord | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return syncAuthUser(container.repos, {
    authUserId: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.name as string | undefined) ?? null,
  });
}
```

- [ ] **Step 3: Add the createRepositories barrel export to @planr/db**

In `packages/db/src/index.ts` append:
```ts
export { createRepositories } from "./repositories/index";
```

- [ ] **Step 4: Typecheck + boundary + commit**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/web typecheck; echo "tc=$?"
pnpm lint; echo "lint=$?"
```
Expected: tc=0; lint=0 (web imports core + db, never `@prisma/client` directly). Commit:
```bash
git add apps/web/src/server packages/db/src/index.ts
git commit -m "feat(web): composition root (prisma->repos->services) + current-user auth glue

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: tRPC context + router with authorization + integration tests

**Files:** Create `apps/web/src/server/trpc.ts`, `apps/web/src/server/routers/app.ts`, `apps/web/vitest.int.config.ts`, `apps/web/src/server/routers/app.int.test.ts`.

- [ ] **Step 1: tRPC init + context + authedProcedure**

`apps/web/src/server/trpc.ts`:
```ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { UserRecord } from "@planr/core";
import { container, type Container } from "./container";

export interface TrpcContext {
  user: UserRecord | null;
  container: Container;
}

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export function makeContext(user: UserRecord | null): TrpcContext {
  return { user, container };
}
```

- [ ] **Step 2: The app router**

`apps/web/src/server/routers/app.ts`:
```ts
import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

export const appRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  organizations: router({
    list: authedProcedure.query(({ ctx }) => ctx.container.repos.orgs.listForUser(ctx.user.id)),
    create: authedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { organization } = await ctx.container.tenancy.provisionOrganization({
          name: input.name,
          creator: { authUserId: ctx.user.authUserId, email: ctx.user.email, name: ctx.user.name },
        });
        return organization;
      }),
  }),

  events: router({
    list: authedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(async ({ ctx, input }) => {
        await ctx.container.authz.requireMembership(ctx.user.id, input.organizationId);
        return ctx.container.events.list(input.organizationId);
      }),
    create: authedProcedure
      .input(
        z.object({
          organizationId: z.string(),
          eventTypeKey: z.enum(["wedding", "birthday", "funeral", "bridal_shower", "corporate"]),
          name: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await ctx.container.authz.requirePermission(
          ctx.user.id,
          input.organizationId,
          "event:create",
        );
        return ctx.container.events.create({
          organizationId: input.organizationId,
          eventTypeKey: input.eventTypeKey,
          name: input.name,
          date: null,
        });
      }),
    modules: authedProcedure
      .input(z.object({ organizationId: z.string(), eventId: z.string() }))
      .query(async ({ ctx, input }) => {
        await ctx.container.authz.requireMembership(ctx.user.id, input.organizationId);
        return ctx.container.events.resolveModules({
          organizationId: input.organizationId,
          eventId: input.eventId,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 3: Integration test config + tests (against Supabase)**

`apps/web/vitest.int.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.int.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
```
`apps/web/src/server/routers/app.int.test.ts` — drives the router with an injected auth user, against a fresh DB. Reuses the db test harness:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestDb, type TestDb } from "@planr/db/src/testing/test-db";
import { createRepositories, type Repositories } from "@planr/db";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeAuthorizationService,
  syncAuthUser,
} from "@planr/core";
import { appRouter } from "./app";
import type { TrpcContext } from "../trpc";

let db: TestDb;
let repos: Repositories;

function ctxFor(user: Awaited<ReturnType<typeof syncAuthUser>> | null): TrpcContext {
  return {
    user,
    container: {
      repos,
      tenancy: makeTenancyService(repos),
      events: makeEventService(repos),
      entitlements: makeEntitlementService(repos),
      authz: makeAuthorizationService(repos),
    },
  };
}

beforeAll(async () => {
  db = await startTestDb();
  repos = createRepositories(db.prisma);
});
afterAll(async () => {
  await db?.stop();
});

describe("appRouter (integration, Supabase Postgres)", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(ctxFor(null));
    await expect(caller.organizations.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates an org (caller becomes owner) and lists it", async () => {
    const user = await syncAuthUser(repos, { authUserId: "auth_a", email: "a@x.com", name: "A" });
    const caller = appRouter.createCaller(ctxFor(user));
    const org = await caller.organizations.create({ name: "Smith Wedding" });
    const list = await caller.organizations.list();
    expect(list.map((o) => o.id)).toContain(org.id);
  });

  it("gates event creation by permission and resolves modules", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_o", email: "o@x.com", name: "O" });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Jones Wedding" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Jones Day",
    });
    const modules = await ownerCaller.events.modules({ organizationId: org.id, eventId: event.id });
    expect(modules.find((m) => m.module === "guests")).toMatchObject({ locked: false });
    expect(modules.find((m) => m.module === "seating")).toMatchObject({ locked: true });

    // a viewer in the same org cannot create events
    const viewer = await syncAuthUser(repos, { authUserId: "auth_v", email: "v@x.com", name: "V" });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    const viewerCaller = appRouter.createCaller(ctxFor(viewer));
    await expect(
      viewerCaller.events.create({ organizationId: org.id, eventTypeKey: "wedding", name: "x" }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("blocks non-members from listing another org's events", async () => {
    const a = await syncAuthUser(repos, { authUserId: "auth_m1", email: "m1@x.com", name: null });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_m2", email: "m2@x.com", name: null });
    const org = await appRouter.createCaller(ctxFor(a)).organizations.create({ name: "Private" });
    await expect(
      appRouter.createCaller(ctxFor(stranger)).events.list({ organizationId: org.id }),
    ).rejects.toThrowError(/not a member/i);
  });
});
```

- [ ] **Step 4: Run the integration tests**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | tail -12
```
Expected: 4 passing.

- [ ] **Step 5: Typecheck + commit**

Run `pnpm --filter @planr/web typecheck; echo tc=$?` → 0. Commit:
```bash
git add apps/web/src/server apps/web/vitest.int.config.ts
git commit -m "feat(web): tRPC router (org/event/modules) with authorization + integration tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: tRPC HTTP route, authed home page, CI typecheck

**Files:** Create `apps/web/src/app/api/trpc/[trpc]/route.ts`; modify `apps/web/src/app/page.tsx`; modify `.github/workflows/ci.yml`.

- [ ] **Step 1: tRPC fetch handler wired to the request's user**

`apps/web/src/app/api/trpc/[trpc]/route.ts`:
```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../server/routers/app";
import { makeContext } from "../../../../server/trpc";
import { getCurrentUser } from "../../../../server/auth";

const handler = async (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => makeContext(await getCurrentUser()),
  });

export { handler as GET, handler as POST };
```

- [ ] **Step 2: Minimal authed home page (server component) proving the wiring**

Replace `apps/web/src/app/page.tsx`:
```tsx
import { getCurrentUser } from "../server/auth";
import { container } from "../server/container";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main>
        <h1>Planr</h1>
        <p>Not signed in. (Auth UI lands in Plan 4.)</p>
      </main>
    );
  }
  const orgs = await container.repos.orgs.listForUser(user.id);
  return (
    <main>
      <h1>Planr</h1>
      <p>Signed in as {user.email}</p>
      <h2>Your organizations ({orgs.length})</h2>
      <ul>
        {orgs.map((o) => (
          <li key={o.id}>{o.name}</li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Generate Next route types and typecheck**

Run:
```bash
cd /Users/papii/Planr
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' \
  NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54421' \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_x' \
  SUPABASE_SECRET_KEY='sb_secret_x' \
  NEXT_PUBLIC_BASE_URL='http://localhost:3000' \
  pnpm --filter @planr/web exec next build --no-lint 2>&1 | tail -15
pnpm --filter @planr/web typecheck; echo "tc=$?"
```
Expected: build succeeds (compiles the route + page); `tc=0`. (The env vars satisfy `parseEnv` at build time.)

- [ ] **Step 4: Add web typecheck to CI (the offline `verify` job already runs `pnpm typecheck` across the workspace — confirm @planr/web is included)**

Turbo's `typecheck` task runs every package's `typecheck` script, so `@planr/web` is picked up automatically once it has the script (it does). No CI edit needed for typecheck. Add a guard so the web build is also exercised — append to the `verify` job steps in `.github/workflows/ci.yml`, after `pnpm test`:
```yaml
      - run: pnpm --filter @planr/web exec next build --no-lint
        env:
          DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
          NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54421"
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_ci"
          SUPABASE_SECRET_KEY: "sb_secret_ci"
          NEXT_PUBLIC_BASE_URL: "http://localhost:3000"
```
And add `apps/*` to the integration job? No — the web integration tests run in the `integration` job. Append to that job's steps (after the db `test:int`):
```yaml
      - run: pnpm --filter @planr/web run test:int
```
with the same `TEST_DATABASE_URL` env already on that job.

- [ ] **Step 5: Full local verification**

Run:
```bash
pnpm install --frozen-lockfile
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck; echo "tc=$?"          # all packages incl @planr/web
pnpm lint; echo "lint=$?"
pnpm test 2>&1 | grep "Tests "        # offline unit suite
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | grep "Tests "
```
Expected: tc=0, lint=0, offline suite green, db integration 8, web integration 4.

- [ ] **Step 6: Commit**

```bash
git add apps/web .github/workflows/ci.yml
git commit -m "feat(web): tRPC HTTP route + authed home page + CI web build/integration

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review (against the spec)

**Spec coverage:**
- §8 auth (Supabase owns identity; our tables own authz; orgs app-managed; user synced) → Tasks 2,3 (identity model), 6 (Supabase SSR), 7 (`getCurrentUser`+`syncAuthUser`), 8 (`authedProcedure`).
- §5 tenancy (org-scoped, membership roles) → Tasks 3,4,8 (procedures enforce membership + permission).
- §7 entitlement gating → Task 8 (`events.modules` → core `resolveModules`).
- §9 env fail-fast → Task 1; layering/boundary (no Prisma outside db) → Tasks 7,8 (web imports `@planr/db`/`@planr/core`, never `@prisma/client`).
- §6 event-type polymorphism → Task 8 (`eventTypeKey` enum input → registry-driven resolution; adding a type needs no API change beyond the input enum).

**Deferred (by design):** browser auth pages, dashboard UI, Playwright E2E → Plan 4. Stripe/billing → Plan 5.

**Placeholder scan:** none — every code/test step is complete.

**Type consistency:** the identity rename is applied consistently — `authUserId` (User), `orgs.create/findById/listForUser`, `users.upsertByAuthUserId/findByAuthUserId`, `provisionOrganization({name,creator:{authUserId,email,name}})`, `syncAuthUser(repos,{...})` — across ports (Task 3), fakes (Task 3), tenancy service (Task 3), adapters (Task 3), authorization service (Task 4), and the tRPC router/tests (Task 8). `TrpcContext` ({user, container}) matches between `trpc.ts` (Task 8) and the integration test's `ctxFor`. `Container` shape ({repos, tenancy, events, entitlements, authz}) matches between `container.ts` (Task 7) and the test. The `@planr/db` barrel exports `prisma`, `PrismaClient`, `createRepositories` (Tasks 7) used by `container.ts`. Permission strings (`event:create`) match the `Permission` union from Plan 1.
```
