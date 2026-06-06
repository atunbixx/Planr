# Planr Billing Core — Plan Registry & Entitlement Provisioning (Plan 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the processor-agnostic write-side of the entitlement engine — a declarative **plan registry** and an idempotent **provisioning service** (`applyPlanPurchase`) that turns a plan purchase into entitlement rows — and prove end-to-end against Supabase that *purchasing a wedding plan unlocks the modules the resolver had locked*. No Stripe SDK (that's Plan 6).

**Architecture:** A plan is a declarative record (`key`, price, interval, scope, granted entitlements) in `@planr/core/src/billing/plans.ts` — the same registry-over-code pattern as event types and capabilities. `makeBillingService(repos).applyPlanPurchase(...)` grants each of a plan's entitlements idempotently via a new `EntitlementRepository.grantIfAbsent`. Because the resolver (Plan 1) reads `heldFor` and the provisioning writes those same rows, the read and write sides close the loop with zero new coupling. The Stripe webhook (Plan 6) will be a thin caller of `applyPlanPurchase`.

**Tech Stack:** TypeScript (strict), Vitest, the existing `@planr/core` entitlement resolver + `@planr/db` Prisma adapters + the Supabase integration-test harness.

**Reference spec:** `docs/superpowers/specs/2026-06-04-planr-foundation-design.md` (§7.2 entitlement engine, §7.3 launch packaging).
**Builds on:** Plans 1-4 (branch `foundation-redesign`). Local Supabase up (`supabase start`; DB `postgresql://postgres:postgres@127.0.0.1:54422/postgres`).

**Environment facts:** pnpm 10.32.1; `TEST_DATABASE_URL`/`DATABASE_URL` = the local Supabase Postgres for integration tests; `prisma generate` needs `DATABASE_URL` defined.

---

## File structure (locked)

```
packages/core/src/billing/plans.ts                     # Plan registry (Task 1)
packages/core/src/billing/plans.test.ts
packages/core/src/ports/repositories.ts                # + grantIfAbsent (Task 2)
packages/core/src/testing/fakes.ts                     # fake grantIfAbsent (Task 2)
packages/db/src/repositories/entitlement.repository.ts # adapter grantIfAbsent (Task 2)
packages/db/src/repositories/repositories.int.test.ts  # adapter test (Task 2)
packages/core/src/services/billing.service.ts          # applyPlanPurchase (Task 3)
packages/core/src/services/billing.service.test.ts
packages/core/src/index.ts                             # barrel exports (Tasks 1-3)
packages/db/src/billing-flow.int.test.ts               # purchase-unlocks-modules (Task 4)
```

---

## Task 1: Plan registry

**Files:** Create `packages/core/src/billing/plans.ts`, `packages/core/src/billing/plans.test.ts`; modify `packages/core/src/index.ts`.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/billing/plans.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getPlan, allPlans, planGrants } from "./plans";

describe("plan registry", () => {
  it("defines the wedding annual plan as an event-scoped grant of event_type:wedding", () => {
    const plan = getPlan("wedding_annual");
    expect(plan.scope).toBe("event");
    expect(plan.interval).toBe("year");
    expect(plan.grants).toContain("event_type:wedding");
  });

  it("defines all_access as an organization-scoped plan granting all_access", () => {
    const plan = getPlan("all_access_annual");
    expect(plan.scope).toBe("organization");
    expect(plan.grants).toEqual(["all_access"]);
  });

  it("exposes prices in minor units with a currency", () => {
    const plan = getPlan("birthday_annual");
    expect(plan.priceMinor).toBe(4900);
    expect(plan.currency).toBe("usd");
  });

  it("throws for an unknown plan", () => {
    expect(() => getPlan("nope")).toThrowError(/not a registered plan/i);
  });

  it("planGrants returns the plan's entitlements", () => {
    expect(planGrants("pro_annual")).toContain("module:vendor_matching");
  });

  it("allPlans lists every registered plan key once", () => {
    const keys = allPlans().map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("wedding_annual");
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

Run: `pnpm --filter @planr/core test` → fails (no `./plans`).

- [ ] **Step 3: Implement the registry**

Create `packages/core/src/billing/plans.ts`:
```ts
import type { Entitlement } from "../types";

export type PlanInterval = "year" | "one_time";
export type PlanScope = "organization" | "event";

export interface Plan {
  key: string;
  label: string;
  priceMinor: number; // smallest currency unit, e.g. cents
  currency: string; // ISO 4217 lowercase, e.g. "usd"
  interval: PlanInterval;
  scope: PlanScope; // what an entitlement attaches to
  grants: Entitlement[];
}

// Illustrative launch prices — the business owns these; changing them is a registry edit.
const PLANS: Record<string, Plan> = {
  birthday_annual: {
    key: "birthday_annual",
    label: "Birthday planning (annual)",
    priceMinor: 4900,
    currency: "usd",
    interval: "year",
    scope: "event",
    grants: ["event_type:birthday"],
  },
  wedding_annual: {
    key: "wedding_annual",
    label: "Wedding planning (annual)",
    priceMinor: 9900,
    currency: "usd",
    interval: "year",
    scope: "event",
    grants: ["event_type:wedding"],
  },
  pro_annual: {
    key: "pro_annual",
    label: "Pro (annual)",
    priceMinor: 7900,
    currency: "usd",
    interval: "year",
    scope: "event",
    grants: ["module:vendor_matching", "module:gift_registry"],
  },
  all_access_annual: {
    key: "all_access_annual",
    label: "All-Access / Planner (annual)",
    priceMinor: 29900,
    currency: "usd",
    interval: "year",
    scope: "organization",
    grants: ["all_access"],
  },
};

export function getPlan(key: string): Plan {
  const plan = PLANS[key];
  if (!plan) {
    throw new Error(`"${key}" is not a registered plan.`);
  }
  return plan;
}

export function planGrants(key: string): Entitlement[] {
  return getPlan(key).grants;
}

export function allPlans(): Plan[] {
  return Object.values(PLANS);
}
```

- [ ] **Step 4: Barrel + run**

Append to `packages/core/src/index.ts`:
```ts
export {
  getPlan,
  planGrants,
  allPlans,
  type Plan,
  type PlanInterval,
  type PlanScope,
} from "./billing/plans";
```
Run `pnpm --filter @planr/core test` (6 new pass) and `pnpm --filter @planr/core typecheck` (0).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): billing plan registry (event/org-scoped plans → entitlements)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Idempotent `grantIfAbsent` on the entitlement repository

**Files:** Modify `packages/core/src/ports/repositories.ts`, `packages/core/src/testing/fakes.ts`, `packages/db/src/repositories/entitlement.repository.ts`, `packages/db/src/repositories/repositories.int.test.ts`.

- [ ] **Step 1: Add to the port**

In `packages/core/src/ports/repositories.ts`, add to `EntitlementRepository` (after `grant`):
```ts
  grantIfAbsent(input: {
    organizationId: string;
    eventId: string | null;
    key: Entitlement;
    source: string;
  }): Promise<EntitlementRecord>;
```

- [ ] **Step 2: Implement in the fakes**

In `packages/core/src/testing/fakes.ts`, add to the `entitlements` object (after `grant`):
```ts
      async grantIfAbsent({ organizationId, eventId, key, source }) {
        const existing = entitlements.find(
          (e) => e.organizationId === organizationId && e.eventId === eventId && e.key === key,
        );
        if (existing) return { ...existing };
        const created: EntitlementRecord = { id: id("ent"), organizationId, eventId, key, source };
        entitlements.push(created);
        return { ...created };
      },
```

- [ ] **Step 3: Implement in the Prisma adapter**

In `packages/db/src/repositories/entitlement.repository.ts`, add the method to `PrismaEntitlementRepository` (after `grant`):
```ts
  async grantIfAbsent(input: {
    organizationId: string;
    eventId: string | null;
    key: Entitlement;
    source: string;
  }): Promise<EntitlementRecord> {
    const existing = await this.prisma.entitlement.findFirst({
      where: { organizationId: input.organizationId, eventId: input.eventId, key: input.key },
    });
    if (existing) {
      return {
        id: existing.id,
        organizationId: existing.organizationId,
        eventId: existing.eventId,
        key: existing.key as Entitlement,
        source: existing.source,
      };
    }
    const row = await this.prisma.entitlement.create({ data: input });
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      key: row.key as Entitlement,
      source: row.source,
    };
  }
```

- [ ] **Step 4: Add an integration test**

In `packages/db/src/repositories/repositories.int.test.ts`, add inside the `describe`:
```ts
  it("grantIfAbsent is idempotent for the same (org,event,key)", async () => {
    const org = await repos.orgs.create({ name: "Idem" });
    const a = await repos.entitlements.grantIfAbsent({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:a",
    });
    const b = await repos.entitlements.grantIfAbsent({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:b",
    });
    expect(b.id).toBe(a.id);
    const held = await repos.entitlements.heldFor({ organizationId: org.id, eventId: null });
    expect(held.filter((k) => k === "all_access")).toHaveLength(1);
  });
```

- [ ] **Step 5: Run everything**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck 2>&1 | grep Tasks:
pnpm test 2>&1 | grep "Tests "
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
```
Expected: typecheck 4/4; offline suite unchanged + passing; db-int 11 (was 10).

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/db
git commit -m "feat(core,db): idempotent EntitlementRepository.grantIfAbsent

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Billing service — `applyPlanPurchase`

**Files:** Create `packages/core/src/services/billing.service.ts`, `packages/core/src/services/billing.service.test.ts`; modify `packages/core/src/index.ts`.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/services/billing.service.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeBillingService } from "./billing.service";

describe("billing service", () => {
  it("grants the plan's entitlements for an event-scoped plan", async () => {
    const repos = makeFakeRepositories();
    const billing = makeBillingService(repos);
    const granted = await billing.applyPlanPurchase({
      organizationId: "o1",
      eventId: "e1",
      planKey: "wedding_annual",
      source: "stripe:cs_test_1",
    });
    expect(granted.map((g) => g.key)).toContain("event_type:wedding");
    const held = await repos.entitlements.heldFor({ organizationId: "o1", eventId: "e1" });
    expect(held).toContain("event_type:wedding");
  });

  it("grants org-level entitlements with a null eventId for org-scoped plans", async () => {
    const repos = makeFakeRepositories();
    const billing = makeBillingService(repos);
    await billing.applyPlanPurchase({
      organizationId: "o1",
      eventId: null,
      planKey: "all_access_annual",
      source: "stripe:cs_test_2",
    });
    const held = await repos.entitlements.heldFor({ organizationId: "o1", eventId: "anything" });
    expect(held).toContain("all_access");
  });

  it("is idempotent — applying the same purchase twice does not duplicate grants", async () => {
    const repos = makeFakeRepositories();
    const billing = makeBillingService(repos);
    const input = {
      organizationId: "o1",
      eventId: "e1",
      planKey: "pro_annual" as const,
      source: "stripe:cs_test_3",
    };
    await billing.applyPlanPurchase(input);
    await billing.applyPlanPurchase(input);
    const held = await repos.entitlements.heldFor({ organizationId: "o1", eventId: "e1" });
    expect(held.filter((k) => k === "module:vendor_matching")).toHaveLength(1);
  });

  it("rejects an event-scoped plan with no eventId", async () => {
    const repos = makeFakeRepositories();
    const billing = makeBillingService(repos);
    await expect(
      billing.applyPlanPurchase({
        organizationId: "o1",
        eventId: null,
        planKey: "wedding_annual",
        source: "x",
      }),
    ).rejects.toThrowError(/event/i);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

Run: `pnpm --filter @planr/core test` → fails (no `./billing.service`).

- [ ] **Step 3: Implement**

Create `packages/core/src/services/billing.service.ts`:
```ts
import type { Repositories, EntitlementRecord } from "../ports/repositories";
import { getPlan } from "../billing/plans";

export function makeBillingService(repos: Repositories) {
  return {
    /**
     * Grants every entitlement a plan confers, idempotently. Called from a verified
     * billing webhook (Plan 6) — NOT directly from a user-facing mutation.
     * Event-scoped plans attach to `eventId`; org-scoped plans attach to the org (null eventId).
     */
    async applyPlanPurchase(input: {
      organizationId: string;
      eventId: string | null;
      planKey: string;
      source: string;
    }): Promise<EntitlementRecord[]> {
      const plan = getPlan(input.planKey);
      if (plan.scope === "event" && !input.eventId) {
        throw new Error(`Plan "${plan.key}" is event-scoped and requires an eventId.`);
      }
      const eventId = plan.scope === "organization" ? null : input.eventId;
      const granted: EntitlementRecord[] = [];
      for (const key of plan.grants) {
        granted.push(
          await repos.entitlements.grantIfAbsent({
            organizationId: input.organizationId,
            eventId,
            key,
            source: input.source,
          }),
        );
      }
      return granted;
    },
  };
}

export type BillingService = ReturnType<typeof makeBillingService>;
```

- [ ] **Step 4: Barrel + run**

Append to `packages/core/src/index.ts`:
```ts
export { makeBillingService, type BillingService } from "./services/billing.service";
```
Run `pnpm --filter @planr/core test` (4 new pass) and `pnpm --filter @planr/core typecheck` (0).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): billing service applyPlanPurchase (idempotent plan→entitlement provisioning)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Integration test — a purchase unlocks the resolver's locked modules

This closes the loop: the Plan-4 E2E showed `seating` locked; here we prove a wedding-plan purchase unlocks it, end-to-end over real Postgres.

**Files:** Create `packages/db/src/billing-flow.int.test.ts`.

- [ ] **Step 1: Write the test**

Create `packages/db/src/billing-flow.int.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  makeTenancyService,
  makeEventService,
  makeBillingService,
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

describe("billing flow (purchase unlocks modules, over Postgres)", () => {
  it("unlocks a wedding's locked modules after the wedding plan is purchased", async () => {
    const repos = createRepositories(db.prisma);
    const tenancy = makeTenancyService(repos);
    const events = makeEventService(repos);
    const billing = makeBillingService(repos);

    const { organization } = await tenancy.provisionOrganization({
      name: "Bill Co",
      creator: { authUserId: "auth_bill", email: "bill@x.com", name: "Bill" },
    });
    const event = await events.create({
      organizationId: organization.id,
      eventTypeKey: "wedding",
      name: "Bill Wedding",
      date: null,
    });

    // Before purchase: seating is a non-baseline core module → locked.
    const before = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(before.find((m) => m.module === "seating")).toMatchObject({
      locked: true,
      reason: "needs_event_type_plan",
    });

    // Purchase the wedding plan (as a verified webhook would).
    await billing.applyPlanPurchase({
      organizationId: organization.id,
      eventId: event.id,
      planKey: "wedding_annual",
      source: "stripe:cs_test_flow",
    });

    // After purchase: seating is unlocked.
    const after = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(after.find((m) => m.module === "seating")).toMatchObject({ locked: false });

    // Advanced module (vendor_matching) still locked — it needs the Pro plan.
    expect(after.find((m) => m.module === "vendor_matching")).toMatchObject({
      locked: true,
      reason: "needs_pro",
    });

    // Buy Pro → vendor_matching unlocks.
    await billing.applyPlanPurchase({
      organizationId: organization.id,
      eventId: event.id,
      planKey: "pro_annual",
      source: "stripe:cs_test_pro",
    });
    const afterPro = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(afterPro.find((m) => m.module === "vendor_matching")).toMatchObject({ locked: false });
  });
});
```

- [ ] **Step 2: Run the integration suite**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
```
Expected: db-int 12 (was 11) — the new billing-flow file's 1 test plus the prior 11.

- [ ] **Step 3: Final full gate**

Run:
```bash
pnpm typecheck 2>&1 | grep Tasks:
pnpm lint; echo "lint=$?"
pnpm test 2>&1 | grep "Tests "
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | grep "Tests "
```
Expected: typecheck 4/4, lint=0, offline suite green, db-int 12, web-int 4.

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/billing-flow.int.test.ts
git commit -m "test(db): purchasing a plan unlocks the resolver's gated modules (end-to-end)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review (against the spec)

**Spec coverage:**
- §7.2 entitlement engine (write side) → Tasks 2-3 (`grantIfAbsent` + `applyPlanPurchase`); the read side was Plan 1's resolver, and Task 4 proves they compose.
- §7.3 launch packaging (Free / per-event-type / Pro / All-Access) → Task 1 registry (`birthday_annual`, `wedding_annual`, `pro_annual`, `all_access_annual`; Free is the resolver's baseline, not a plan).
- §7.2 "entitlements granted by purchases; packaging via a plan registry, zero feature-code change" → adding/repricing a plan is a registry edit (Task 1); the resolver and services are untouched.

**Deferred (by design):** the Stripe SDK, Checkout session creation, the webhook route + signature verification, and Subscription-row lifecycle (renewals/cancellations) → Plan 6 (needs Stripe test keys). `applyPlanPurchase` is intentionally NOT exposed as a user-callable tRPC mutation (that would let users grant themselves entitlements) — it is called only by the verified webhook.

**Placeholder scan:** none — every code/test step is complete. Prices are explicitly illustrative.

**Type consistency:** `Plan.grants: Entitlement[]` uses the Plan-1 `Entitlement` template-literal type, so `event_type:wedding` / `module:vendor_matching` / `all_access` are compile-checked. `grantIfAbsent`'s signature is identical across the port (Task 2), the fake (Task 2), and the Prisma adapter (Task 2). `applyPlanPurchase` (Task 3) consumes `getPlan`/`Plan.scope`/`Plan.grants` from Task 1 and `repos.entitlements.grantIfAbsent` from Task 2. The Task 4 integration test reuses `makeTenancyService`/`makeEventService` (Plan 2-3) + `makeBillingService` (Task 3), and asserts the resolver reasons (`needs_event_type_plan`, `needs_pro`) defined in Plan 1.
```
