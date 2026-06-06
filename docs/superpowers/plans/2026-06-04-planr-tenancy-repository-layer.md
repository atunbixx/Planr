# Planr Tenancy & Repository Layer — Implementation Plan (Plan 2 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tenancy domain layer — repository *ports* + use-case services + Clerk→Membership sync logic in `@planr/core` (unit-tested with in-memory fakes), and their Prisma *adapters* + first real migration in `@planr/db` (integration-tested against an ephemeral Docker Postgres) — proving a full org → member → event → entitlement → module-resolution flow end-to-end, with no UI and no live auth.

**Architecture:** Hexagonal / ports-and-adapters. Because the lint boundary forbids `@planr/core` from importing Prisma, `@planr/core` defines repository **interfaces (ports)** and framework-free **services** that depend on them; `@planr/db` provides **Prisma adapters** implementing those ports. Domain services are unit-tested against in-memory fakes (fast, offline); Prisma adapters are integration-tested against a real Postgres started via testcontainers (Docker). Clerk webhook handling is modeled as pure sync functions over the ports, so it's fully testable without Clerk.

**Tech Stack:** TypeScript (strict), Vitest, Prisma 6 + Postgres, `@testcontainers/postgresql` (Docker), the existing `@planr/core` registries/resolver/RBAC.

**Reference spec:** `docs/superpowers/specs/2026-06-04-planr-foundation-design.md` (§5 tenancy, §6 event-types, §7 entitlements, §8 auth, §10 enterprise).
**Builds on:** Plan 1 (`docs/superpowers/plans/2026-06-04-planr-foundation-core.md`). Branch: `foundation-redesign`.

**Environment facts (verified):** pnpm 10.32.1, Docker 29.4, psql 18 available. `prisma generate`/`migrate` need `DATABASE_URL` defined. The default `pnpm test` must stay fast/offline — integration tests (Docker) are named `*.int.test.ts`, excluded from the default run, and executed via a dedicated script.

---

## Shared vocabulary (consistent across all tasks)

Domain record types and port interfaces live in `@planr/core` and are reused verbatim by fakes (core tests) and Prisma adapters (db tests). Defined once in Task 3.

- Records: `OrganizationRecord`, `UserRecord`, `MembershipRecord`, `EventRecord`, `EntitlementRecord`.
- Ports: `OrganizationRepository`, `UserRepository`, `MembershipRepository`, `EventRepository`, `EntitlementRepository`.
- Services (factory functions taking ports as deps): `makeTenancyService`, `makeEventService`, `makeEntitlementService`.
- Sync: `mapClerkRole`, `makeClerkSync`.
- Adapters: `PrismaOrganizationRepository` … + `createRepositories(prisma)` factory.

---

## File structure (locked)

```
packages/core/src/
  ports/repositories.ts              # record types + 5 repo interfaces        (Task 3)
  testing/fakes.ts                   # in-memory fake repos for core tests      (Task 3)
  services/tenancy.service.ts        # provisionOrganization, addMember         (Task 4)
  services/tenancy.service.test.ts
  sync/clerk-role.ts                 # mapClerkRole                             (Task 5)
  sync/clerk-role.test.ts
  sync/clerk-sync.ts                 # makeClerkSync orchestrator              (Task 6)
  sync/clerk-sync.test.ts
  services/event.service.ts          # create, list, resolveModules            (Task 7)
  services/event.service.test.ts
  services/entitlement.service.ts    # grant                                   (Task 7)
  index.ts                           # APPEND exports                          (Tasks 3-7)
packages/db/
  prisma/migrations/                 # first real migration + partial index    (Task 8)
  src/index.ts                       # hot-reload singleton guard (modify)     (Task 2)
  src/testing/test-db.ts             # testcontainers Postgres helper          (Task 8)
  src/repositories/*.repository.ts   # 5 Prisma adapters                       (Task 9)
  src/repositories/index.ts          # createRepositories(prisma)              (Task 9)
  src/repositories/repositories.int.test.ts   # adapter integration tests      (Task 9)
  src/flow.int.test.ts               # end-to-end flow through services        (Task 10)
  vitest.int.config.ts               # integration-only vitest config          (Task 8)
  package.json                       # add test:int script + deps              (Task 8)
vitest.workspace.ts                  # exclude *.int.test.ts from default run  (Task 8)
.github/workflows/ci.yml             # add integration job (postgres service)  (Task 10)
```

---

## Task 1: Targeted legacy cleanup

Remove dead duplicates and artifacts that the holistic review flagged (committed `dev.db`, npm `package-lock.json`, the vendored template, the dead fork, loose scripts). **Keep** the old `src/` feature code, `prisma/` schema, and `tests/` — those are porting references for the later feature plans.

**Files:** deletions only + `eslint.config.mjs` (shrink the legacy ignore list).

- [ ] **Step 1: Delete dead trees and artifacts**

Run:
```bash
cd /Users/papii/Planr
git rm -r --quiet --ignore-unmatch \
  wedding-planner-new \
  src/nextjs-admin-dashboard-main \
  prisma/dev.db \
  package-lock.json \
  start-3003.js start-3003.sh start-server.js start-server-3003.js start-dev.js start-dev-server.sh start-server.sh \
  debug-vendors.js fix-schema.sh complete-setup.sh setup-database.sh run-migrations.js commit-changes.sh
echo "--- remaining root scripts ---"; ls *.js *.sh 2>/dev/null || echo "(none)"
```
Expected: the listed paths are removed. (`--ignore-unmatch` tolerates any that were already absent.)

- [ ] **Step 2: Remove now-dead ESLint ignores for the deleted paths**

Read `eslint.config.mjs`. In the FIRST config object's `ignores` array, remove ONLY the entries that pointed at now-deleted paths: `"wedding-planner-new/**"`, `"src/nextjs-admin-dashboard-main/**"`, and any `start-*.js`/`debug-vendors.js`/`*.sh` root-file entries. KEEP the ignores for still-present legacy dirs (`src/**`, `prisma/**`, `.next/**`, `playwright-report/**`, `test-results/**`, `tests/**`, `temp-data/**`, `scripts/**`, root `next.config.ts`/`tailwind.config.ts` etc.). Do not touch the Prisma-boundary config block.

- [ ] **Step 3: Verify the gate stays green**

Run:
```bash
DATABASE_URL='postgresql://dummy:dummy@localhost:5432/dummy?schema=public' pnpm --filter @planr/db run db:generate >/dev/null
pnpm lint; echo "lint=$?"
pnpm test 2>&1 | tail -3
```
Expected: `lint=0`; tests still 31 passing. If lint surfaces errors from a path whose ignore you removed prematurely, re-add that specific ignore.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove dead duplicate trees, committed dev.db, npm lockfile, and loose scripts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Prisma hot-reload singleton guard

Prevent connection-pool exhaustion when the Next.js dev server (Plan 3) imports `@planr/db` under HMR.

**Files:** Modify `packages/db/src/index.ts`.

- [ ] **Step 1: Replace the bare client with a global-guarded singleton**

Rewrite `packages/db/src/index.ts` to:
```ts
import { PrismaClient } from "./generated/client";

export { PrismaClient };

const globalForPrisma = globalThis as unknown as { __planrPrisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.__planrPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__planrPrisma = prisma;
}
```

- [ ] **Step 2: Verify typecheck and the boundary still hold**

Run:
```bash
DATABASE_URL='postgresql://dummy:dummy@localhost:5432/dummy?schema=public' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/db typecheck; echo "tc=$?"
pnpm --filter @planr/eslint-fixtures test 2>&1 | tail -3
```
Expected: `tc=0`; the boundary meta-test still passes (db may import Prisma).

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/index.ts
git commit -m "fix(db): guard PrismaClient as a global singleton for dev hot-reload

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Repository ports + in-memory fakes

Define the hexagonal contract (`@planr/core` owns it) and fakes used to unit-test every service offline.

**Files:**
- Create: `packages/core/src/ports/repositories.ts`, `packages/core/src/testing/fakes.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/testing/fakes.test.ts`

- [ ] **Step 1: Write the failing test (fakes behave as a minimal store)**

Create `packages/core/src/testing/fakes.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "./fakes";

describe("in-memory fake repositories", () => {
  it("upserts an organization by clerkOrgId idempotently", async () => {
    const { orgs } = makeFakeRepositories();
    const a = await orgs.upsertByClerkOrgId({ clerkOrgId: "org_1", name: "Smith Wedding" });
    const b = await orgs.upsertByClerkOrgId({ clerkOrgId: "org_1", name: "Smith Wedding (renamed)" });
    expect(b.id).toBe(a.id);
    expect(b.name).toBe("Smith Wedding (renamed)");
    expect(await orgs.findByClerkOrgId("org_1")).toMatchObject({ id: a.id });
  });

  it("enforces one membership per (org,user) on upsert", async () => {
    const { memberships } = makeFakeRepositories();
    await memberships.upsert({ organizationId: "o1", userId: "u1", role: "viewer" });
    await memberships.upsert({ organizationId: "o1", userId: "u1", role: "admin" });
    const list = await memberships.listByOrganization("o1");
    expect(list).toHaveLength(1);
    expect(list[0]!.role).toBe("admin");
  });

  it("returns org-level and matching event-level entitlements from heldFor", async () => {
    const { entitlements } = makeFakeRepositories();
    await entitlements.grant({ organizationId: "o1", eventId: null, key: "all_access", source: "plan:agency" });
    await entitlements.grant({ organizationId: "o1", eventId: "e1", key: "event_type:wedding", source: "purchase:1" });
    await entitlements.grant({ organizationId: "o1", eventId: "e2", key: "module:vendor_matching", source: "purchase:2" });
    const held = await entitlements.heldFor({ organizationId: "o1", eventId: "e1" });
    expect(held.sort()).toEqual(["all_access", "event_type:wedding"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./fakes`.

- [ ] **Step 3: Define the ports**

Create `packages/core/src/ports/repositories.ts`:
```ts
import type { Role, EventTypeKey, Entitlement } from "../types";

export interface OrganizationRecord {
  id: string;
  clerkOrgId: string;
  name: string;
}
export interface UserRecord {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
}
export interface MembershipRecord {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
}
export interface EventRecord {
  id: string;
  organizationId: string;
  eventTypeKey: EventTypeKey;
  name: string;
  date: Date | null;
}
export interface EntitlementRecord {
  id: string;
  organizationId: string;
  eventId: string | null;
  key: Entitlement;
  source: string;
}

export interface OrganizationRepository {
  upsertByClerkOrgId(input: { clerkOrgId: string; name: string }): Promise<OrganizationRecord>;
  findByClerkOrgId(clerkOrgId: string): Promise<OrganizationRecord | null>;
}
export interface UserRepository {
  upsertByClerkUserId(input: {
    clerkUserId: string;
    email: string;
    name: string | null;
  }): Promise<UserRecord>;
  findByClerkUserId(clerkUserId: string): Promise<UserRecord | null>;
}
export interface MembershipRepository {
  upsert(input: { organizationId: string; userId: string; role: Role }): Promise<MembershipRecord>;
  remove(input: { organizationId: string; userId: string }): Promise<void>;
  listByOrganization(organizationId: string): Promise<MembershipRecord[]>;
  find(input: { organizationId: string; userId: string }): Promise<MembershipRecord | null>;
}
export interface EventRepository {
  create(input: {
    organizationId: string;
    eventTypeKey: EventTypeKey;
    name: string;
    date: Date | null;
  }): Promise<EventRecord>;
  listByOrganization(organizationId: string): Promise<EventRecord[]>;
  findById(input: { organizationId: string; id: string }): Promise<EventRecord | null>;
}
export interface EntitlementRepository {
  grant(input: {
    organizationId: string;
    eventId: string | null;
    key: Entitlement;
    source: string;
  }): Promise<EntitlementRecord>;
  heldFor(input: { organizationId: string; eventId: string | null }): Promise<Entitlement[]>;
}

export interface Repositories {
  orgs: OrganizationRepository;
  users: UserRepository;
  memberships: MembershipRepository;
  events: EventRepository;
  entitlements: EntitlementRepository;
}
```

- [ ] **Step 4: Implement the fakes**

Create `packages/core/src/testing/fakes.ts`:
```ts
import type {
  Repositories,
  OrganizationRecord,
  UserRecord,
  MembershipRecord,
  EventRecord,
  EntitlementRecord,
} from "../ports/repositories";

export function makeFakeRepositories(): Repositories {
  let seq = 0;
  const id = (p: string) => `${p}_${++seq}`;

  const orgs: OrganizationRecord[] = [];
  const users: UserRecord[] = [];
  const memberships: MembershipRecord[] = [];
  const events: EventRecord[] = [];
  const entitlements: EntitlementRecord[] = [];

  return {
    orgs: {
      async upsertByClerkOrgId({ clerkOrgId, name }) {
        const existing = orgs.find((o) => o.clerkOrgId === clerkOrgId);
        if (existing) {
          existing.name = name;
          return { ...existing };
        }
        const created: OrganizationRecord = { id: id("org"), clerkOrgId, name };
        orgs.push(created);
        return { ...created };
      },
      async findByClerkOrgId(clerkOrgId) {
        const found = orgs.find((o) => o.clerkOrgId === clerkOrgId);
        return found ? { ...found } : null;
      },
    },
    users: {
      async upsertByClerkUserId({ clerkUserId, email, name }) {
        const existing = users.find((u) => u.clerkUserId === clerkUserId);
        if (existing) {
          existing.email = email;
          existing.name = name;
          return { ...existing };
        }
        const created: UserRecord = { id: id("user"), clerkUserId, email, name };
        users.push(created);
        return { ...created };
      },
      async findByClerkUserId(clerkUserId) {
        const found = users.find((u) => u.clerkUserId === clerkUserId);
        return found ? { ...found } : null;
      },
    },
    memberships: {
      async upsert({ organizationId, userId, role }) {
        const existing = memberships.find(
          (m) => m.organizationId === organizationId && m.userId === userId,
        );
        if (existing) {
          existing.role = role;
          return { ...existing };
        }
        const created: MembershipRecord = { id: id("mem"), organizationId, userId, role };
        memberships.push(created);
        return { ...created };
      },
      async remove({ organizationId, userId }) {
        const i = memberships.findIndex(
          (m) => m.organizationId === organizationId && m.userId === userId,
        );
        if (i >= 0) memberships.splice(i, 1);
      },
      async listByOrganization(organizationId) {
        return memberships.filter((m) => m.organizationId === organizationId).map((m) => ({ ...m }));
      },
      async find({ organizationId, userId }) {
        const found = memberships.find(
          (m) => m.organizationId === organizationId && m.userId === userId,
        );
        return found ? { ...found } : null;
      },
    },
    events: {
      async create({ organizationId, eventTypeKey, name, date }) {
        const created: EventRecord = { id: id("evt"), organizationId, eventTypeKey, name, date };
        events.push(created);
        return { ...created };
      },
      async listByOrganization(organizationId) {
        return events.filter((e) => e.organizationId === organizationId).map((e) => ({ ...e }));
      },
      async findById({ organizationId, id: eventId }) {
        const found = events.find((e) => e.organizationId === organizationId && e.id === eventId);
        return found ? { ...found } : null;
      },
    },
    entitlements: {
      async grant({ organizationId, eventId, key, source }) {
        const created: EntitlementRecord = { id: id("ent"), organizationId, eventId, key, source };
        entitlements.push(created);
        return { ...created };
      },
      async heldFor({ organizationId, eventId }) {
        return entitlements
          .filter(
            (e) =>
              e.organizationId === organizationId &&
              (e.eventId === null || e.eventId === eventId),
          )
          .map((e) => e.key);
      },
    },
  };
}
```

- [ ] **Step 5: Export the ports from the package barrel**

Append to `packages/core/src/index.ts`:
```ts
export type {
  OrganizationRecord,
  UserRecord,
  MembershipRecord,
  EventRecord,
  EntitlementRecord,
  OrganizationRepository,
  UserRepository,
  MembershipRepository,
  EventRepository,
  EntitlementRepository,
  Repositories,
} from "./ports/repositories";
```
(Do NOT export `./testing/fakes` from the barrel — it's a test helper, imported directly by tests.)

- [ ] **Step 6: Run the test and typecheck**

Run: `pnpm --filter @planr/core test` → all pass (prior 26 + 3 new = 29). `pnpm --filter @planr/core typecheck` → exit 0.

- [ ] **Step 7: Commit**

```bash
git add packages/core
git commit -m "feat(core): repository ports + in-memory fakes for the tenancy layer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Tenancy service (provision organization, add member)

**Files:**
- Create: `packages/core/src/services/tenancy.service.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/services/tenancy.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/services/tenancy.service.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "./tenancy.service";

describe("tenancy service", () => {
  it("provisions an organization with its creator as owner", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const { organization, ownerMembership } = await svc.provisionOrganization({
      clerkOrgId: "org_1",
      name: "Smith Wedding",
      creator: { clerkUserId: "user_1", email: "a@b.com", name: "Ada" },
    });
    expect(organization.clerkOrgId).toBe("org_1");
    expect(ownerMembership.role).toBe("owner");
    const members = await repos.memberships.listByOrganization(organization.id);
    expect(members).toHaveLength(1);
  });

  it("is idempotent — re-provisioning the same org keeps one owner membership", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const input = {
      clerkOrgId: "org_1",
      name: "Smith Wedding",
      creator: { clerkUserId: "user_1", email: "a@b.com", name: "Ada" },
    };
    const first = await svc.provisionOrganization(input);
    const second = await svc.provisionOrganization(input);
    expect(second.organization.id).toBe(first.organization.id);
    expect(await repos.memberships.listByOrganization(first.organization.id)).toHaveLength(1);
  });

  it("adds a member with the given role", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const { organization } = await svc.provisionOrganization({
      clerkOrgId: "org_1",
      name: "Smith Wedding",
      creator: { clerkUserId: "user_1", email: "a@b.com", name: "Ada" },
    });
    const membership = await svc.addMember({
      organizationId: organization.id,
      user: { clerkUserId: "user_2", email: "c@d.com", name: "Bo" },
      role: "planner",
    });
    expect(membership.role).toBe("planner");
    expect(await repos.memberships.listByOrganization(organization.id)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./tenancy.service`.

- [ ] **Step 3: Implement the service**

Create `packages/core/src/services/tenancy.service.ts`:
```ts
import type { Repositories, OrganizationRecord, MembershipRecord } from "../ports/repositories";
import type { Role } from "../types";

interface ClerkUserInput {
  clerkUserId: string;
  email: string;
  name: string | null;
}

export function makeTenancyService(repos: Repositories) {
  return {
    async provisionOrganization(input: {
      clerkOrgId: string;
      name: string;
      creator: ClerkUserInput;
    }): Promise<{ organization: OrganizationRecord; ownerMembership: MembershipRecord }> {
      const organization = await repos.orgs.upsertByClerkOrgId({
        clerkOrgId: input.clerkOrgId,
        name: input.name,
      });
      const owner = await repos.users.upsertByClerkUserId(input.creator);
      const ownerMembership = await repos.memberships.upsert({
        organizationId: organization.id,
        userId: owner.id,
        role: "owner",
      });
      return { organization, ownerMembership };
    },

    async addMember(input: {
      organizationId: string;
      user: ClerkUserInput;
      role: Role;
    }): Promise<MembershipRecord> {
      const user = await repos.users.upsertByClerkUserId(input.user);
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

- [ ] **Step 4: Export from the barrel**

Append to `packages/core/src/index.ts`:
```ts
export { makeTenancyService, type TenancyService } from "./services/tenancy.service";
```

- [ ] **Step 5: Run the test and typecheck**

Run: `pnpm --filter @planr/core test` → all pass (29 + 3 = 32). `pnpm --filter @planr/core typecheck` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): tenancy service (provision organization, add member)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Clerk role mapping

**Files:**
- Create: `packages/core/src/sync/clerk-role.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/sync/clerk-role.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/sync/clerk-role.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mapClerkRole } from "./clerk-role";

describe("mapClerkRole", () => {
  it("maps Clerk admin roles to admin", () => {
    expect(mapClerkRole("org:admin")).toBe("admin");
    expect(mapClerkRole("admin")).toBe("admin");
  });

  it("maps Clerk member roles to viewer", () => {
    expect(mapClerkRole("org:member")).toBe("viewer");
    expect(mapClerkRole("basic_member")).toBe("viewer");
  });

  it("falls back to viewer for any unknown role", () => {
    expect(mapClerkRole("org:something_custom")).toBe("viewer");
    expect(mapClerkRole("")).toBe("viewer");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./clerk-role`.

- [ ] **Step 3: Implement**

Create `packages/core/src/sync/clerk-role.ts`:
```ts
import type { Role } from "../types";

/**
 * Maps a Clerk organization-membership role string to a Planr Role.
 * Clerk's defaults are "org:admin" / "org:member" (and legacy "admin" / "basic_member").
 * Unknown/custom roles fall back to the least-privileged "viewer".
 * Note: "owner" is never assigned via Clerk role sync — it is set during
 * organization provisioning (the creator). See makeTenancyService.
 */
export function mapClerkRole(clerkRole: string): Role {
  if (clerkRole === "org:admin" || clerkRole === "admin") return "admin";
  return "viewer";
}
```

- [ ] **Step 4: Export from the barrel**

Append to `packages/core/src/index.ts`:
```ts
export { mapClerkRole } from "./sync/clerk-role";
```

- [ ] **Step 5: Run the test and typecheck**

Run: `pnpm --filter @planr/core test` → all pass (32 + 3 = 35). `pnpm --filter @planr/core typecheck` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): map Clerk membership roles to Planr roles (default viewer)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Clerk sync orchestrator

Pure functions that turn Clerk webhook events into repository writes. No HTTP, no Clerk SDK — just the mapping logic, fully testable with fakes.

**Files:**
- Create: `packages/core/src/sync/clerk-sync.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/sync/clerk-sync.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/sync/clerk-sync.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeClerkSync } from "./clerk-sync";

describe("Clerk sync orchestrator", () => {
  it("upserts a user on user.created/updated", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await sync.userUpserted({ clerkUserId: "user_1", email: "a@b.com", name: "Ada" });
    expect(await repos.users.findByClerkUserId("user_1")).toMatchObject({ email: "a@b.com" });
  });

  it("upserts an organization on organization.created/updated", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await sync.organizationUpserted({ clerkOrgId: "org_1", name: "Smith Wedding" });
    expect(await repos.orgs.findByClerkOrgId("org_1")).toMatchObject({ name: "Smith Wedding" });
  });

  it("creates a membership with the mapped role, resolving org+user", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await sync.organizationUpserted({ clerkOrgId: "org_1", name: "Smith Wedding" });
    await sync.membershipUpserted({
      clerkOrgId: "org_1",
      clerkUserId: "user_2",
      email: "c@d.com",
      name: "Bo",
      clerkRole: "org:admin",
    });
    const org = await repos.orgs.findByClerkOrgId("org_1");
    const members = await repos.memberships.listByOrganization(org!.id);
    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe("admin");
  });

  it("removes a membership on organizationMembership.deleted", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await sync.organizationUpserted({ clerkOrgId: "org_1", name: "Smith Wedding" });
    await sync.membershipUpserted({
      clerkOrgId: "org_1",
      clerkUserId: "user_2",
      email: "c@d.com",
      name: "Bo",
      clerkRole: "org:member",
    });
    await sync.membershipDeleted({ clerkOrgId: "org_1", clerkUserId: "user_2" });
    const org = await repos.orgs.findByClerkOrgId("org_1");
    expect(await repos.memberships.listByOrganization(org!.id)).toHaveLength(0);
  });

  it("ignores membership events for an unknown organization without throwing", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await expect(
      sync.membershipDeleted({ clerkOrgId: "org_missing", clerkUserId: "user_2" }),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./clerk-sync`.

- [ ] **Step 3: Implement**

Create `packages/core/src/sync/clerk-sync.ts`:
```ts
import type { Repositories } from "../ports/repositories";
import { mapClerkRole } from "./clerk-role";

export function makeClerkSync(repos: Repositories) {
  return {
    async userUpserted(evt: { clerkUserId: string; email: string; name: string | null }) {
      await repos.users.upsertByClerkUserId(evt);
    },

    async organizationUpserted(evt: { clerkOrgId: string; name: string }) {
      await repos.orgs.upsertByClerkOrgId(evt);
    },

    async membershipUpserted(evt: {
      clerkOrgId: string;
      clerkUserId: string;
      email: string;
      name: string | null;
      clerkRole: string;
    }) {
      const org = await repos.orgs.findByClerkOrgId(evt.clerkOrgId);
      if (!org) return; // org webhook not yet processed; Clerk will retry/order
      const user = await repos.users.upsertByClerkUserId({
        clerkUserId: evt.clerkUserId,
        email: evt.email,
        name: evt.name,
      });
      await repos.memberships.upsert({
        organizationId: org.id,
        userId: user.id,
        role: mapClerkRole(evt.clerkRole),
      });
    },

    async membershipDeleted(evt: { clerkOrgId: string; clerkUserId: string }) {
      const org = await repos.orgs.findByClerkOrgId(evt.clerkOrgId);
      if (!org) return;
      const user = await repos.users.findByClerkUserId(evt.clerkUserId);
      if (!user) return;
      await repos.memberships.remove({ organizationId: org.id, userId: user.id });
    },
  };
}

export type ClerkSync = ReturnType<typeof makeClerkSync>;
```

- [ ] **Step 4: Export from the barrel**

Append to `packages/core/src/index.ts`:
```ts
export { makeClerkSync, type ClerkSync } from "./sync/clerk-sync";
```

- [ ] **Step 5: Run the test and typecheck**

Run: `pnpm --filter @planr/core test` → all pass (35 + 5 = 40). `pnpm --filter @planr/core typecheck` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): Clerk sync orchestrator (user/org/membership upsert+delete)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Event service (create, list, resolveModules) + entitlement service (grant)

`resolveModules` is the keystone: it joins the capability registry (relevance), the held entitlements (access), and the resolver into the per-event module list the UI will render.

**Files:**
- Create: `packages/core/src/services/event.service.ts`, `packages/core/src/services/entitlement.service.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/services/event.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/services/event.service.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeEventService } from "./event.service";
import { makeEntitlementService } from "./entitlement.service";

describe("event service", () => {
  it("creates and lists events for an organization", async () => {
    const repos = makeFakeRepositories();
    const events = makeEventService(repos);
    await events.create({ organizationId: "o1", eventTypeKey: "wedding", name: "Smith", date: null });
    const list = await events.list("o1");
    expect(list).toHaveLength(1);
    expect(list[0]!.eventTypeKey).toBe("wedding");
  });

  it("resolveModules reflects free baseline when nothing is purchased", async () => {
    const repos = makeFakeRepositories();
    const events = makeEventService(repos);
    const event = await events.create({
      organizationId: "o1",
      eventTypeKey: "wedding",
      name: "Smith",
      date: null,
    });
    const modules = await events.resolveModules({ organizationId: "o1", eventId: event.id });
    const guests = modules.find((m) => m.module === "guests");
    const seating = modules.find((m) => m.module === "seating");
    const matching = modules.find((m) => m.module === "vendor_matching");
    expect(guests).toMatchObject({ locked: false, reason: "free" });
    expect(seating).toMatchObject({ locked: true, reason: "needs_event_type_plan" });
    expect(matching).toMatchObject({ locked: true, reason: "needs_pro" });
    // gift_registry is wedding-relevant; agenda (corporate) must be absent
    expect(modules.some((m) => m.module === "gift_registry")).toBe(true);
    expect(modules.some((m) => m.module === "agenda")).toBe(false);
  });

  it("resolveModules unlocks after the event-type plan is granted", async () => {
    const repos = makeFakeRepositories();
    const events = makeEventService(repos);
    const ents = makeEntitlementService(repos);
    const event = await events.create({
      organizationId: "o1",
      eventTypeKey: "wedding",
      name: "Smith",
      date: null,
    });
    await ents.grant({
      organizationId: "o1",
      eventId: event.id,
      key: "event_type:wedding",
      source: "purchase:1",
    });
    const modules = await events.resolveModules({ organizationId: "o1", eventId: event.id });
    expect(modules.find((m) => m.module === "seating")).toMatchObject({ locked: false });
  });

  it("resolveModules throws for an event not in the organization", async () => {
    const repos = makeFakeRepositories();
    const events = makeEventService(repos);
    await expect(
      events.resolveModules({ organizationId: "o1", eventId: "missing" }),
    ).rejects.toThrowError(/not found/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/core test`
Expected: FAIL — cannot find module `./event.service`.

- [ ] **Step 3: Implement both services**

Create `packages/core/src/services/entitlement.service.ts`:
```ts
import type { Repositories, EntitlementRecord } from "../ports/repositories";
import type { Entitlement } from "../types";

export function makeEntitlementService(repos: Repositories) {
  return {
    async grant(input: {
      organizationId: string;
      eventId: string | null;
      key: Entitlement;
      source: string;
    }): Promise<EntitlementRecord> {
      return repos.entitlements.grant(input);
    },
  };
}

export type EntitlementService = ReturnType<typeof makeEntitlementService>;
```

Create `packages/core/src/services/event.service.ts`:
```ts
import type { Repositories, EventRecord } from "../ports/repositories";
import type { EventTypeKey, ModuleKey } from "../types";
import { modulesForEventType } from "../capabilities/registry";
import { resolveModuleAccess, type ModuleAccess } from "../entitlements/resolver";

export interface ResolvedModule extends ModuleAccess {
  module: ModuleKey;
}

export function makeEventService(repos: Repositories) {
  return {
    async create(input: {
      organizationId: string;
      eventTypeKey: EventTypeKey;
      name: string;
      date: Date | null;
    }): Promise<EventRecord> {
      return repos.events.create(input);
    },

    async list(organizationId: string): Promise<EventRecord[]> {
      return repos.events.listByOrganization(organizationId);
    },

    async resolveModules(input: {
      organizationId: string;
      eventId: string;
    }): Promise<ResolvedModule[]> {
      const event = await repos.events.findById({
        organizationId: input.organizationId,
        id: input.eventId,
      });
      if (!event) {
        throw new Error(
          `Event "${input.eventId}" not found in organization "${input.organizationId}".`,
        );
      }
      const held = await repos.entitlements.heldFor({
        organizationId: input.organizationId,
        eventId: event.id,
      });
      return modulesForEventType(event.eventTypeKey).map((m) => ({
        module: m.key,
        ...resolveModuleAccess({ module: m.key, eventType: event.eventTypeKey, held }),
      }));
    },
  };
}

export type EventService = ReturnType<typeof makeEventService>;
```

- [ ] **Step 4: Export from the barrel**

Append to `packages/core/src/index.ts`:
```ts
export { makeEventService, type EventService, type ResolvedModule } from "./services/event.service";
export {
  makeEntitlementService,
  type EntitlementService,
} from "./services/entitlement.service";
```

- [ ] **Step 5: Run the test and typecheck**

Run: `pnpm --filter @planr/core test` → all pass (40 + 4 = 44). `pnpm --filter @planr/core typecheck` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): event service with module resolution + entitlement grant service

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: First Prisma migration + testcontainers harness + integration test config

Sets up the real database: a committed migration (with the partial unique index that fixes the org-level entitlement dedupe gap), a Docker-Postgres test helper, and a vitest config that runs only `*.int.test.ts` (kept out of the default offline `pnpm test`).

**Files:**
- Create: `packages/db/prisma/migrations/<timestamp>_init/migration.sql` (generated), `packages/db/src/testing/test-db.ts`, `packages/db/vitest.int.config.ts`
- Modify: `packages/db/package.json`, `vitest.workspace.ts`

- [ ] **Step 1: Generate the first migration against a throwaway Docker Postgres**

Run:
```bash
docker run -d --rm --name planr-migrate -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=planr -p 55432:5432 postgres:16
sleep 4
cd /Users/papii/Planr
DATABASE_URL='postgresql://postgres:pw@localhost:55432/planr?schema=public' \
  pnpm --filter @planr/db exec prisma migrate dev --name init --skip-generate
docker stop planr-migrate
```
Expected: a new folder `packages/db/prisma/migrations/<timestamp>_init/migration.sql` is created with `CREATE TABLE` statements for User, Organization, Membership, Event, Subscription, Entitlement, plus the enums. A `migration_lock.toml` (provider = postgresql) is written.

- [ ] **Step 2: Append the partial unique index for org-level entitlements**

The schema's `@@unique([organizationId, eventId, key])` does NOT dedupe rows where `eventId IS NULL` (Postgres treats NULLs as distinct), so org-level grants like `all_access` could duplicate. Append a partial unique index to the generated `migration.sql` (edit the file, add at the end):
```sql
-- Dedupe org-level entitlements (eventId IS NULL), which the composite unique cannot cover.
CREATE UNIQUE INDEX "Entitlement_org_key_orglevel_key"
  ON "Entitlement" ("organizationId", "key")
  WHERE "eventId" IS NULL;
```

- [ ] **Step 3: Add the testcontainers Postgres helper**

Add the dependency:
```bash
pnpm --filter @planr/db add -D @testcontainers/postgresql
```
Create `packages/db/src/testing/test-db.ts`:
```ts
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "../generated/client";

const execFileAsync = promisify(execFile);
const dbRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export interface TestDb {
  prisma: PrismaClient;
  url: string;
  stop(): Promise<void>;
}

/**
 * Starts an ephemeral Postgres in Docker, applies all Prisma migrations,
 * and returns a connected PrismaClient. Call stop() in afterAll.
 */
export async function startTestDb(): Promise<TestDb> {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer(
    "postgres:16",
  ).start();
  const url = container.getConnectionUri();
  await execFileAsync(
    "pnpm",
    ["exec", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
    { cwd: dbRoot, env: { ...process.env, DATABASE_URL: url } },
  );
  const prisma = new PrismaClient({ datasourceUrl: url });
  return {
    prisma,
    url,
    async stop() {
      await prisma.$disconnect();
      await container.stop();
    },
  };
}
```

- [ ] **Step 4: Add the integration vitest config and scripts**

Create `packages/db/vitest.int.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.int.test.ts"],
    testTimeout: 120_000, // container start + migrate
    hookTimeout: 120_000,
    fileParallelism: false, // one container at a time
  },
});
```
Modify `packages/db/package.json` scripts to add:
```json
    "test:int": "vitest run --config vitest.int.config.ts"
```
(Keep the existing typecheck/db:validate/db:generate scripts. `@planr/db` has no default `test` script, so the offline `pnpm test` won't try to run integration tests from here.)

- [ ] **Step 5: Keep integration tests out of the default offline run**

Modify `vitest.workspace.ts` so the default `pnpm test` never picks up `*.int.test.ts`:
```ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    extends: false,
    test: {
      name: "unit",
      include: ["packages/*/src/**/*.test.ts", "packages/*/*.test.ts"],
      exclude: ["**/*.int.test.ts", "**/node_modules/**", "**/generated/**"],
    },
  },
]);
```

- [ ] **Step 6: Verify the default suite is unchanged and the migration is valid**

Run:
```bash
pnpm test 2>&1 | tail -3   # still 44 core + 3 config + 2 fixtures = 49, no integration
DATABASE_URL='postgresql://dummy:dummy@localhost:5432/dummy?schema=public' pnpm --filter @planr/db exec prisma validate
```
Expected: default suite unchanged (49 passing, 0 integration run); `prisma validate` → schema valid. (The migration SQL is exercised in Task 9.)

- [ ] **Step 7: Commit**

```bash
git add packages/db vitest.workspace.ts pnpm-lock.yaml
git commit -m "feat(db): first Postgres migration (+ org-level entitlement partial unique) and testcontainers harness

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Prisma repository adapters + integration tests

Implement the five ports against Prisma and verify them against a real Postgres.

**Files:**
- Create: `packages/db/src/repositories/{organization,user,membership,event,entitlement}.repository.ts`, `packages/db/src/repositories/index.ts`, `packages/db/src/repositories/repositories.int.test.ts`

- [ ] **Step 1: Write the failing integration test**

Create `packages/db/src/repositories/repositories.int.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestDb, type TestDb } from "../testing/test-db";
import { createRepositories } from "./index";

let db: TestDb;
let repos: ReturnType<typeof createRepositories>;

beforeAll(async () => {
  db = await startTestDb();
  repos = createRepositories(db.prisma);
});
afterAll(async () => {
  await db?.stop();
});

describe("Prisma repository adapters", () => {
  it("upserts organizations idempotently by clerkOrgId", async () => {
    const a = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_1", name: "Smith" });
    const b = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_1", name: "Smith 2" });
    expect(b.id).toBe(a.id);
    expect(b.name).toBe("Smith 2");
  });

  it("enforces one membership per (org,user) and lists by org", async () => {
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_2", name: "Jones" });
    const user = await repos.users.upsertByClerkUserId({
      clerkUserId: "user_1",
      email: "a@b.com",
      name: "Ada",
    });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "viewer" });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "admin" });
    const list = await repos.memberships.listByOrganization(org.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.role).toBe("admin");
  });

  it("creates events scoped to an organization and finds by id", async () => {
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_3", name: "Lee" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Lee Wedding",
      date: null,
    });
    expect(await repos.events.findById({ organizationId: org.id, id: event.id })).toMatchObject({
      eventTypeKey: "wedding",
    });
    expect(await repos.events.findById({ organizationId: "other", id: event.id })).toBeNull();
  });

  it("heldFor returns org-level + matching event-level entitlement keys", async () => {
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_4", name: "Kim" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Kim Wedding",
      date: null,
    });
    await repos.entitlements.grant({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:agency",
    });
    await repos.entitlements.grant({
      organizationId: org.id,
      eventId: event.id,
      key: "event_type:wedding",
      source: "purchase:1",
    });
    const held = await repos.entitlements.heldFor({ organizationId: org.id, eventId: event.id });
    expect([...held].sort()).toEqual(["all_access", "event_type:wedding"]);
  });

  it("partial unique index blocks duplicate org-level grants", async () => {
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_5", name: "Park" });
    await repos.entitlements.grant({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:a",
    });
    await expect(
      repos.entitlements.grant({
        organizationId: org.id,
        eventId: null,
        key: "all_access",
        source: "plan:b",
      }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @planr/db test:int`
Expected: FAIL — cannot find module `./index` (and the repositories don't exist yet). (Docker must be running; the container will start, then the import fails.)

- [ ] **Step 3: Implement the five adapters**

Create `packages/db/src/repositories/organization.repository.ts`:
```ts
import type { OrganizationRepository, OrganizationRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByClerkOrgId(input: { clerkOrgId: string; name: string }): Promise<OrganizationRecord> {
    const row = await this.prisma.organization.upsert({
      where: { clerkOrgId: input.clerkOrgId },
      create: { clerkOrgId: input.clerkOrgId, name: input.name },
      update: { name: input.name },
    });
    return { id: row.id, clerkOrgId: row.clerkOrgId, name: row.name };
  }

  async findByClerkOrgId(clerkOrgId: string): Promise<OrganizationRecord | null> {
    const row = await this.prisma.organization.findUnique({ where: { clerkOrgId } });
    return row ? { id: row.id, clerkOrgId: row.clerkOrgId, name: row.name } : null;
  }
}
```

Create `packages/db/src/repositories/user.repository.ts`:
```ts
import type { UserRepository, UserRecord } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByClerkUserId(input: {
    clerkUserId: string;
    email: string;
    name: string | null;
  }): Promise<UserRecord> {
    const row = await this.prisma.user.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: { clerkUserId: input.clerkUserId, email: input.email, name: input.name },
      update: { email: input.email, name: input.name },
    });
    return { id: row.id, clerkUserId: row.clerkUserId, email: row.email, name: row.name };
  }

  async findByClerkUserId(clerkUserId: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { clerkUserId } });
    return row
      ? { id: row.id, clerkUserId: row.clerkUserId, email: row.email, name: row.name }
      : null;
  }
}
```

Create `packages/db/src/repositories/membership.repository.ts`:
```ts
import type { MembershipRepository, MembershipRecord } from "@planr/core";
import type { Role } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(input: {
    organizationId: string;
    userId: string;
    role: Role;
  }): Promise<MembershipRecord> {
    const row = await this.prisma.membership.upsert({
      where: {
        organizationId_userId: { organizationId: input.organizationId, userId: input.userId },
      },
      create: { organizationId: input.organizationId, userId: input.userId, role: input.role },
      update: { role: input.role },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as Role,
    };
  }

  async remove(input: { organizationId: string; userId: string }): Promise<void> {
    await this.prisma.membership.deleteMany({
      where: { organizationId: input.organizationId, userId: input.userId },
    });
  }

  async listByOrganization(organizationId: string): Promise<MembershipRecord[]> {
    const rows = await this.prisma.membership.findMany({ where: { organizationId } });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as Role,
    }));
  }

  async find(input: {
    organizationId: string;
    userId: string;
  }): Promise<MembershipRecord | null> {
    const row = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: { organizationId: input.organizationId, userId: input.userId },
      },
    });
    return row
      ? {
          id: row.id,
          organizationId: row.organizationId,
          userId: row.userId,
          role: row.role as Role,
        }
      : null;
  }
}
```

Create `packages/db/src/repositories/event.repository.ts`:
```ts
import type { EventRepository, EventRecord } from "@planr/core";
import type { EventTypeKey } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    organizationId: string;
    eventTypeKey: EventTypeKey;
    name: string;
    date: Date | null;
  }): Promise<EventRecord> {
    const row = await this.prisma.event.create({ data: input });
    return this.toRecord(row);
  }

  async listByOrganization(organizationId: string): Promise<EventRecord[]> {
    const rows = await this.prisma.event.findMany({ where: { organizationId } });
    return rows.map((row) => this.toRecord(row));
  }

  async findById(input: { organizationId: string; id: string }): Promise<EventRecord | null> {
    const row = await this.prisma.event.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
    });
    return row ? this.toRecord(row) : null;
  }

  private toRecord(row: {
    id: string;
    organizationId: string;
    eventTypeKey: string;
    name: string;
    date: Date | null;
  }): EventRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventTypeKey: row.eventTypeKey as EventTypeKey,
      name: row.name,
      date: row.date,
    };
  }
}
```

Create `packages/db/src/repositories/entitlement.repository.ts`:
```ts
import type { EntitlementRepository, EntitlementRecord } from "@planr/core";
import type { Entitlement } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaEntitlementRepository implements EntitlementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async grant(input: {
    organizationId: string;
    eventId: string | null;
    key: Entitlement;
    source: string;
  }): Promise<EntitlementRecord> {
    const row = await this.prisma.entitlement.create({ data: input });
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      key: row.key as Entitlement,
      source: row.source,
    };
  }

  async heldFor(input: {
    organizationId: string;
    eventId: string | null;
  }): Promise<Entitlement[]> {
    const rows = await this.prisma.entitlement.findMany({
      where: {
        organizationId: input.organizationId,
        OR: [{ eventId: null }, { eventId: input.eventId }],
      },
    });
    return rows.map((row) => row.key as Entitlement);
  }
}
```

Create `packages/db/src/repositories/index.ts`:
```ts
import type { Repositories } from "@planr/core";
import type { PrismaClient } from "../generated/client";
import { PrismaOrganizationRepository } from "./organization.repository";
import { PrismaUserRepository } from "./user.repository";
import { PrismaMembershipRepository } from "./membership.repository";
import { PrismaEventRepository } from "./event.repository";
import { PrismaEntitlementRepository } from "./entitlement.repository";

export function createRepositories(prisma: PrismaClient): Repositories {
  return {
    orgs: new PrismaOrganizationRepository(prisma),
    users: new PrismaUserRepository(prisma),
    memberships: new PrismaMembershipRepository(prisma),
    events: new PrismaEventRepository(prisma),
    entitlements: new PrismaEntitlementRepository(prisma),
  };
}
```

- [ ] **Step 4: Add `@planr/core` as a dependency of `@planr/db`**

The adapters import types from `@planr/core`. Add the workspace dependency:
```bash
pnpm --filter @planr/db add @planr/core@workspace:*
```
This must NOT violate the Prisma boundary (db importing core is fine; core must not import db). Confirm the boundary meta-test still passes in a later step.

- [ ] **Step 5: Run the integration test to verify it passes**

Run: `pnpm --filter @planr/db test:int`
Expected: PASS (5 tests), including the partial-unique-index rejection. (Requires Docker.)

- [ ] **Step 6: Typecheck, default suite, lint, boundary**

Run:
```bash
DATABASE_URL='postgresql://dummy:dummy@localhost:5432/dummy?schema=public' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/db typecheck; echo "tc=$?"
pnpm test 2>&1 | tail -3        # default offline suite unchanged
pnpm lint; echo "lint=$?"       # boundary rule: db may import core+prisma; core must not import prisma
```
Expected: `tc=0`; offline suite still 49; `lint=0`.

- [ ] **Step 7: Commit**

```bash
git add packages/db pnpm-lock.yaml
git commit -m "feat(db): Prisma repository adapters + integration tests against Docker Postgres

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: End-to-end flow test + CI integration job

Prove the whole layer composes (real services over real adapters over real Postgres), and make CI run the integration suite.

**Files:**
- Create: `packages/db/src/flow.int.test.ts`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the failing end-to-end flow test**

Create `packages/db/src/flow.int.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeClerkSync,
} from "@planr/core";
import { startTestDb, type TestDb } from "./testing/test-db";
import { createRepositories } from "./repositories/index";

let db: TestDb;

beforeAll(async () => {
  db = await startTestDb();
});
afterAll(async () => {
  await db?.stop();
});

describe("end-to-end tenancy flow (services over Prisma adapters)", () => {
  it("provisions an org, adds a member, creates an event, and gates modules by entitlement", async () => {
    const repos = createRepositories(db.prisma);
    const tenancy = makeTenancyService(repos);
    const events = makeEventService(repos);
    const ents = makeEntitlementService(repos);

    const { organization, ownerMembership } = await tenancy.provisionOrganization({
      clerkOrgId: "org_flow",
      name: "Flow Wedding",
      creator: { clerkUserId: "user_owner", email: "owner@x.com", name: "Owner" },
    });
    expect(ownerMembership.role).toBe("owner");

    await tenancy.addMember({
      organizationId: organization.id,
      user: { clerkUserId: "user_planner", email: "planner@x.com", name: "Planner" },
      role: "planner",
    });
    expect(await repos.memberships.listByOrganization(organization.id)).toHaveLength(2);

    const event = await events.create({
      organizationId: organization.id,
      eventTypeKey: "wedding",
      name: "Flow Wedding Day",
      date: null,
    });

    const before = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(before.find((m) => m.module === "seating")).toMatchObject({ locked: true });

    await ents.grant({
      organizationId: organization.id,
      eventId: event.id,
      key: "event_type:wedding",
      source: "purchase:flow",
    });

    const after = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(after.find((m) => m.module === "seating")).toMatchObject({ locked: false });
  });

  it("syncs a Clerk membership webhook into a queryable membership", async () => {
    const repos = createRepositories(db.prisma);
    const sync = makeClerkSync(repos);
    await sync.organizationUpserted({ clerkOrgId: "org_sync", name: "Sync Co" });
    await sync.membershipUpserted({
      clerkOrgId: "org_sync",
      clerkUserId: "user_sync",
      email: "s@x.com",
      name: "S",
      clerkRole: "org:admin",
    });
    const org = await repos.orgs.findByClerkOrgId("org_sync");
    const members = await repos.memberships.listByOrganization(org!.id);
    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe("admin");
  });
});
```

- [ ] **Step 2: Run to verify it passes**

Run: `pnpm --filter @planr/db test:int`
Expected: PASS — the prior 5 adapter tests + these 2 flow tests = 7 integration tests. (Requires Docker.)

- [ ] **Step 3: Add a CI job that runs the integration suite against a Postgres service**

In `.github/workflows/ci.yml`, ADD a second job (keep the existing `verify` job). testcontainers needs Docker; GitHub-hosted Ubuntu runners provide it, so testcontainers works directly. Add:
```yaml
  integration:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.32.1 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @planr/db run db:generate
      - run: pnpm --filter @planr/db run test:int
```
(`DATABASE_URL` here is only to satisfy `prisma generate`; the integration tests use the testcontainers connection URI, not this value.)

- [ ] **Step 4: Final full local verification**

Run:
```bash
pnpm install --frozen-lockfile
DATABASE_URL='postgresql://dummy:dummy@localhost:5432/dummy?schema=public' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck; echo "tc=$?"
pnpm lint; echo "lint=$?"
pnpm test 2>&1 | tail -3            # offline suite (49)
pnpm --filter @planr/db run test:int 2>&1 | tail -3   # integration (7), Docker required
```
Expected: `tc=0`, `lint=0`, offline 49 passing, integration 7 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/db .github/workflows/ci.yml
git commit -m "test(db): end-to-end tenancy flow over Postgres + CI integration job

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review (completed against the spec)

**Spec coverage:**
- §5 tenancy (Org→Membership→Event, userId/org scoping) → Tasks 3,4,9 (repos enforce org-scoping; `findById`/`findFirst` filter by organizationId).
- §6 event-type polymorphism → Task 7 (`resolveModules` reads `eventTypeKey` against the registry; no hardcoding).
- §7 entitlement gating (relevant-AND-entitled, org- vs event-level grants) → Tasks 3,7,9; partial unique index (Task 8) fixes the org-level dedupe gap the Plan-1 review flagged.
- §8 auth/authorization (Clerk owns identity, our tables own authz; Membership sync) → Tasks 5,6 (sync logic), 9/10 (persisted + queryable). Clerk HTTP/webhook wiring is Plan 3 (needs credentials).
- §10 enterprise (org-scoped, RLS-ready) → org-scoped queries throughout; RLS deferred.
- Plan-1 carry-overs: hot-reload guard → Task 2; legacy cleanup → Task 1; partial unique index → Task 8; repositories feed the resolver pure `Entitlement[]` → Tasks 7,9.

**Deferred (by design):** live Clerk middleware/webhook endpoint, Next.js app, tRPC, Playwright E2E → Plan 3 (Web App & Live Auth Slice). Billing/Stripe → Plan 4.

**Placeholder scan:** none — every code/test step is complete.

**Type consistency:** record types and port interfaces are defined once (Task 3) and imported by fakes (Task 3), services (Tasks 4,6,7), and Prisma adapters (Task 9). `Repositories` shape (`orgs/users/memberships/events/entitlements`) is identical in `makeFakeRepositories` (Task 3) and `createRepositories` (Task 9). `heldFor`/`resolveModules`/`upsertByClerkOrgId`/`upsertByClerkUserId` names match across definition, fakes, services, and adapters. `mapClerkRole` (Task 5) is consumed by `makeClerkSync` (Task 6). Test counts tracked cumulatively: core 26 (end of Plan 1) → 29 → 32 → 35 → 40 → 44; offline workspace total 49; integration 7.
