# Planr Workspaces & Onboarding — Implementation Plan (Plan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "create an organization" wall with a real onboarding fork — an individual signs up, picks "my own event", names their space, picks what they're planning (baby shower, wedding, burial…), and lands *inside their first event*; a business names their agency and lands in a dashboard — with the word "organization" never shown and a workspace-framed home.

**Architecture:** Adds one schema field (`Organization.type = individual | business`) and a thin onboarding/terminology layer over the existing hexagonal core. "Onboarded" = "has ≥1 membership", so a fresh user with zero workspaces is routed to `/onboarding`. Onboarding is server-rendered pages + Server Actions calling new tRPC procedures (the Plan 3/4 pattern); the entitlement engine, event-type registry, and tested core are untouched.

**Tech Stack:** Prisma 6 + Supabase Postgres, `@planr/core` services, tRPC, Next.js 15 (Server Components + Server Actions), Vitest, Playwright.

**Reference spec:** `docs/superpowers/specs/2026-06-05-planr-workspaces-onboarding-design.md`.
**Builds on:** Plans 1-5 (branch `foundation-redesign`). Local Supabase up (`supabase start`; DB `postgresql://postgres:postgres@127.0.0.1:54422/postgres`).

**Environment facts:** pnpm 10.32.1; `TEST_DATABASE_URL`/`DATABASE_URL` = the local Supabase Postgres; `prisma generate` needs `DATABASE_URL` defined; the dev server needs the four Supabase env vars (see Plan 4).

**Design choices that minimise churn:** `Organization.type` defaults to `individual` at every layer (schema `@default(individual)`, optional `type?` on `create`/`provisionOrganization`). So every existing call site keeps working unchanged; only the business onboarding path passes `type: "business"`.

---

## File structure (locked)

```
packages/core/src/types.ts                              # + OrgType (Task 1)
packages/db/prisma/schema.prisma                        # + OrgType enum, Organization.type (Task 1)
packages/db/prisma/migrations/<ts>_organization_type/   (Task 1)
packages/core/src/ports/repositories.ts                 # OrganizationRecord.type; create({name,type?}) (Task 1)
packages/core/src/testing/fakes.ts                      # fake create with type (Task 1)
packages/core/src/services/tenancy.service.ts           # provisionOrganization({..,type?}) (Task 1)
packages/db/src/repositories/organization.repository.ts # adapter create/find map type (Task 1)
packages/core/src/services/onboarding.service.ts        # completeIndividual/completeBusiness (Task 2)
packages/core/src/billing/.. (n/a)
packages/core/src/workspaces/terms.ts                   # workspaceTerms(type) (Task 2)
packages/core/src/index.ts                              # barrel exports (Tasks 1-2)
apps/web/src/server/container.ts                        # + onboarding service (Task 3)
apps/web/src/server/routers/app.ts                      # onboarding.*, workspaces.list (Task 3)
apps/web/src/server/routers/app.int.test.ts             # onboarding integration tests (Task 3)
apps/web/src/app/onboarding/page.tsx                    # the fork (Task 4)
apps/web/src/app/onboarding/individual/page.tsx         # individual form (Task 4)
apps/web/src/app/onboarding/business/page.tsx           # business form (Task 4)
apps/web/src/app/onboarding/actions.ts                  # server actions (Task 4)
apps/web/src/app/dashboard/page.tsx                     # workspace-framed home (Task 5)
apps/web/e2e/onboarding.spec.ts                         # Playwright E2E (Task 6)
```

---

## Task 1: `Organization.type` (individual | business)

**Files:** Modify `packages/core/src/types.ts`, `packages/db/prisma/schema.prisma`, `packages/core/src/ports/repositories.ts`, `packages/core/src/testing/fakes.ts`, `packages/core/src/services/tenancy.service.ts`, `packages/db/src/repositories/organization.repository.ts`, `packages/core/src/index.ts`; create a migration; add a test in `packages/db/src/repositories/repositories.int.test.ts`.

- [ ] **Step 1: Add the `OrgType` domain type**

In `packages/core/src/types.ts`, add after the existing type aliases:
```ts
export type OrgType = "individual" | "business";
```

- [ ] **Step 2: Schema + migration**

In `packages/db/prisma/schema.prisma`, add the enum (next to the other enums) and the field on `Organization`:
```prisma
enum OrgType {
  individual
  business
}
```
In `model Organization`, add the `type` line after `name`:
```prisma
  name          String
  type          OrgType        @default(individual)
```
Create `packages/db/prisma/migrations/20260605120000_organization_type/migration.sql`:
```sql
-- Workspaces are typed: an individual's personal space vs a planner/agency business.
CREATE TYPE "OrgType" AS ENUM ('individual', 'business');
ALTER TABLE "Organization" ADD COLUMN "type" "OrgType" NOT NULL DEFAULT 'individual';
```
Apply + regenerate:
```bash
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' \
  pnpm --filter @planr/db exec prisma migrate deploy --schema prisma/schema.prisma
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
```
Expected: "All migrations have been successfully applied".

- [ ] **Step 3: Port — record gains `type`, `create` accepts optional `type`**

In `packages/core/src/ports/repositories.ts`:
- Add `OrgType` to the import from `../types`: `import type { Role, EventTypeKey, Entitlement, OrgType } from "../types";`
- `OrganizationRecord`: add the field →
```ts
export interface OrganizationRecord {
  id: string;
  name: string;
  type: OrgType;
}
```
- `OrganizationRepository.create`: widen the input →
```ts
  create(input: { name: string; type?: OrgType }): Promise<OrganizationRecord>;
```

- [ ] **Step 4: Fake honours `type` (default individual)**

In `packages/core/src/testing/fakes.ts`, change the `orgs.create` fake:
```ts
      async create({ name, type }) {
        const created: OrganizationRecord = { id: id("org"), name, type: type ?? "individual" };
        orgs.push(created);
        return { ...created };
      },
```
(`findById`/`listForUser` already spread the record, so they carry `type` automatically.)

- [ ] **Step 5: Adapter maps `type`; tenancy passes it through**

In `packages/db/src/repositories/organization.repository.ts`, import `OrgType` and map the column. Replace the class body:
```ts
import type { OrganizationRepository, OrganizationRecord, OrgType } from "@planr/core";
import type { PrismaClient } from "../generated/client";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { name: string; type?: OrgType }): Promise<OrganizationRecord> {
    const row = await this.prisma.organization.create({
      data: { name: input.name, type: input.type ?? "individual" },
    });
    return { id: row.id, name: row.name, type: row.type as OrgType };
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const row = await this.prisma.organization.findUnique({ where: { id } });
    return row ? { id: row.id, name: row.name, type: row.type as OrgType } : null;
  }

  async listForUser(userId: string): Promise<OrganizationRecord[]> {
    const rows = await this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({ id: row.id, name: row.name, type: row.type as OrgType }));
  }
}
```
In `packages/core/src/services/tenancy.service.ts`, thread `type` through `provisionOrganization`:
```ts
import type { Repositories, OrganizationRecord, MembershipRecord } from "../ports/repositories";
import type { Role, OrgType } from "../types";
```
and change the `provisionOrganization` signature + body:
```ts
    async provisionOrganization(input: {
      name: string;
      type?: OrgType;
      creator: AuthUserInput;
    }): Promise<{ organization: OrganizationRecord; ownerMembership: MembershipRecord }> {
      const organization = await repos.orgs.create({ name: input.name, type: input.type });
      const owner = await repos.users.upsertByAuthUserId(input.creator);
      const ownerMembership = await repos.memberships.upsert({
        organizationId: organization.id,
        userId: owner.id,
        role: "owner",
      });
      return { organization, ownerMembership };
    },
```

- [ ] **Step 6: Export `OrgType`; add an integration test**

`packages/core/src/index.ts` re-exports all of `./types` via `export * from "./types"`, so `OrgType` is already exported — no barrel change needed.

In `packages/db/src/repositories/repositories.int.test.ts`, add inside the `describe`:
```ts
  it("creates a business-typed organization and defaults others to individual", async () => {
    const biz = await repos.orgs.create({ name: "Bliss Events", type: "business" });
    const personal = await repos.orgs.create({ name: "Sara's Planning" });
    expect(biz.type).toBe("business");
    expect(personal.type).toBe("individual");
    expect(await repos.orgs.findById(biz.id)).toMatchObject({ type: "business" });
  });
```

- [ ] **Step 7: Verify green**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck 2>&1 | grep Tasks:
pnpm lint; echo "lint=$?"
pnpm test 2>&1 | grep "Tests "
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | grep "Tests "
```
Expected: typecheck 4/4, lint=0, offline suite green, db-int +1 (was 12 → 13), web-int 4. (Existing tests are unchanged because `type` defaults to `individual` everywhere.)

- [ ] **Step 8: Commit**

```bash
git add packages/core packages/db
git commit -m "feat(core,db): Organization.type (individual|business), defaulting to individual

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Onboarding service + terminology helper

**Files:** Create `packages/core/src/services/onboarding.service.ts`, `packages/core/src/services/onboarding.service.test.ts`, `packages/core/src/workspaces/terms.ts`, `packages/core/src/workspaces/terms.test.ts`; modify `packages/core/src/index.ts`.

- [ ] **Step 1: Write the failing onboarding test**

Create `packages/core/src/services/onboarding.service.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeOnboardingService } from "./onboarding.service";

const creator = { authUserId: "auth_1", email: "a@b.com", name: "Ada" };

describe("onboarding service", () => {
  it("completeIndividual creates an individual workspace + owner + first event", async () => {
    const repos = makeFakeRepositories();
    const svc = makeOnboardingService(repos);
    const { organization, event } = await svc.completeIndividual({
      creator,
      spaceName: "Ada's Planning",
      firstEvent: { eventTypeKey: "wedding", name: "Our Wedding" },
    });
    expect(organization.type).toBe("individual");
    expect(organization.name).toBe("Ada's Planning");
    expect(event.eventTypeKey).toBe("wedding");
    expect(event.organizationId).toBe(organization.id);
    const members = await repos.memberships.listByOrganization(organization.id);
    expect(members[0]!.role).toBe("owner");
    expect(await repos.events.listByOrganization(organization.id)).toHaveLength(1);
  });

  it("completeBusiness creates a business workspace + owner, no event", async () => {
    const repos = makeFakeRepositories();
    const svc = makeOnboardingService(repos);
    const { organization } = await svc.completeBusiness({ creator, businessName: "Bliss Events" });
    expect(organization.type).toBe("business");
    expect(organization.name).toBe("Bliss Events");
    expect(await repos.events.listByOrganization(organization.id)).toHaveLength(0);
    const members = await repos.memberships.listByOrganization(organization.id);
    expect(members[0]!.role).toBe("owner");
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

Run: `pnpm --filter @planr/core test` → fails (no `./onboarding.service`).

- [ ] **Step 3: Implement the onboarding service**

Create `packages/core/src/services/onboarding.service.ts`:
```ts
import type { Repositories, OrganizationRecord, EventRecord } from "../ports/repositories";
import type { EventTypeKey } from "../types";
import { makeTenancyService, type AuthUserInput } from "./tenancy.service";
import { makeEventService } from "./event.service";

export function makeOnboardingService(repos: Repositories) {
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);

  return {
    async completeIndividual(input: {
      creator: AuthUserInput;
      spaceName: string;
      firstEvent: { eventTypeKey: EventTypeKey; name: string };
    }): Promise<{ organization: OrganizationRecord; event: EventRecord }> {
      const { organization } = await tenancy.provisionOrganization({
        name: input.spaceName,
        type: "individual",
        creator: input.creator,
      });
      const event = await events.create({
        organizationId: organization.id,
        eventTypeKey: input.firstEvent.eventTypeKey,
        name: input.firstEvent.name,
        date: null,
      });
      return { organization, event };
    },

    async completeBusiness(input: {
      creator: AuthUserInput;
      businessName: string;
    }): Promise<{ organization: OrganizationRecord }> {
      const { organization } = await tenancy.provisionOrganization({
        name: input.businessName,
        type: "business",
        creator: input.creator,
      });
      return { organization };
    },
  };
}

export type OnboardingService = ReturnType<typeof makeOnboardingService>;
```

- [ ] **Step 4: Write the terminology test + helper**

Create `packages/core/src/workspaces/terms.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { workspaceTerms } from "./terms";

describe("workspaceTerms", () => {
  it("uses friendly consumer copy for individuals", () => {
    const t = workspaceTerms("individual");
    expect(t.newEvent).toBe("Plan something new");
    expect(t.members).toBe("People helping you plan");
    expect(t.invite).toBe("Invite someone to help");
  });

  it("uses business copy for businesses", () => {
    const t = workspaceTerms("business");
    expect(t.newEvent).toBe("Create an event");
    expect(t.members).toBe("Team");
    expect(t.invite).toBe("Invite a team member");
  });
});
```
Create `packages/core/src/workspaces/terms.ts`:
```ts
import type { OrgType } from "../types";

export interface WorkspaceTerms {
  newEvent: string;
  members: string;
  invite: string;
  eventsHeading: string;
}

export function workspaceTerms(type: OrgType): WorkspaceTerms {
  if (type === "business") {
    return {
      newEvent: "Create an event",
      members: "Team",
      invite: "Invite a team member",
      eventsHeading: "Events",
    };
  }
  return {
    newEvent: "Plan something new",
    members: "People helping you plan",
    invite: "Invite someone to help",
    eventsHeading: "Your events",
  };
}
```

- [ ] **Step 5: Barrel + run**

Append to `packages/core/src/index.ts`:
```ts
export {
  makeOnboardingService,
  type OnboardingService,
} from "./services/onboarding.service";
export { workspaceTerms, type WorkspaceTerms } from "./workspaces/terms";
```
Run `pnpm --filter @planr/core test` (4 new pass) and `pnpm --filter @planr/core typecheck` (0).

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): onboarding service (individual/business) + workspace terminology helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: tRPC onboarding procedures + workspaces.list

**Files:** Modify `apps/web/src/server/container.ts`, `apps/web/src/server/routers/app.ts`, `apps/web/src/server/routers/app.int.test.ts`.

- [ ] **Step 1: Add the onboarding service to the container**

In `apps/web/src/server/container.ts`:
```ts
import { prisma, createRepositories } from "@planr/db";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeAuthorizationService,
  makeOnboardingService,
} from "@planr/core";

const repos = createRepositories(prisma);

export const container = {
  repos,
  tenancy: makeTenancyService(repos),
  events: makeEventService(repos),
  entitlements: makeEntitlementService(repos),
  authz: makeAuthorizationService(repos),
  onboarding: makeOnboardingService(repos),
};

export type Container = typeof container;
```

- [ ] **Step 2: Add the router procedures**

In `apps/web/src/server/routers/app.ts`, add an `onboarding` router and a `workspaces` router to the `appRouter` (alongside `organizations`/`events`). Insert these as new keys:
```ts
  workspaces: router({
    list: authedProcedure.query(({ ctx }) => ctx.container.repos.orgs.listForUser(ctx.user.id)),
  }),

  onboarding: router({
    completeIndividual: authedProcedure
      .input(
        z.object({
          spaceName: z.string().min(1),
          eventTypeKey: z.enum(["wedding", "birthday", "funeral", "bridal_shower", "corporate"]),
          eventName: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { organization, event } = await ctx.container.onboarding.completeIndividual({
          creator: { authUserId: ctx.user.authUserId, email: ctx.user.email, name: ctx.user.name },
          spaceName: input.spaceName,
          firstEvent: { eventTypeKey: input.eventTypeKey, name: input.eventName },
        });
        return { organizationId: organization.id, eventId: event.id };
      }),
    completeBusiness: authedProcedure
      .input(z.object({ businessName: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { organization } = await ctx.container.onboarding.completeBusiness({
          creator: { authUserId: ctx.user.authUserId, email: ctx.user.email, name: ctx.user.name },
          businessName: input.businessName,
        });
        return { organizationId: organization.id };
      }),
  }),
```

- [ ] **Step 3: Update the integration test's container + add onboarding tests**

In `apps/web/src/server/routers/app.int.test.ts`, add `makeOnboardingService` to the imports from `@planr/core` and to the `ctxFor` container literal:
```ts
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeAuthorizationService,
  makeOnboardingService,
  syncAuthUser,
} from "@planr/core";
```
and inside `ctxFor`'s `container`:
```ts
      authz: makeAuthorizationService(repos),
      onboarding: makeOnboardingService(repos),
```
Then add tests inside the `describe`:
```ts
  it("completeIndividual creates an individual workspace + first event and lists it", async () => {
    const user = await syncAuthUser(repos, { authUserId: "auth_ob1", email: "ob1@x.com", name: "Ob" });
    const caller = appRouter.createCaller(ctxFor(user));
    const res = await caller.onboarding.completeIndividual({
      spaceName: "Ob's Planning",
      eventTypeKey: "birthday",
      eventName: "Ob's 30th",
    });
    const workspaces = await caller.workspaces.list();
    expect(workspaces.find((w) => w.id === res.organizationId)).toMatchObject({ type: "individual" });
    const events = await caller.events.list({ organizationId: res.organizationId });
    expect(events.map((e) => e.id)).toContain(res.eventId);
  });

  it("completeBusiness creates a business workspace with no events", async () => {
    const user = await syncAuthUser(repos, { authUserId: "auth_ob2", email: "ob2@x.com", name: "Biz" });
    const caller = appRouter.createCaller(ctxFor(user));
    const res = await caller.onboarding.completeBusiness({ businessName: "Bliss Events" });
    const workspaces = await caller.workspaces.list();
    expect(workspaces.find((w) => w.id === res.organizationId)).toMatchObject({ type: "business" });
    const events = await caller.events.list({ organizationId: res.organizationId });
    expect(events).toHaveLength(0);
  });
```

- [ ] **Step 4: Run + typecheck**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/web typecheck; echo "tc=$?"
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | grep "Tests "
```
Expected: tc=0; web-int 6 (was 4).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/server
git commit -m "feat(web): tRPC onboarding.completeIndividual/Business + workspaces.list

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Onboarding UI (the fork) + post-auth routing

**Files:** Create `apps/web/src/app/onboarding/page.tsx`, `apps/web/src/app/onboarding/actions.ts`, `apps/web/src/app/onboarding/individual/page.tsx`, `apps/web/src/app/onboarding/business/page.tsx`. (The dashboard's redirect-when-empty lands in Task 5 when we reframe it; here we add a guard so onboarding itself redirects out if already onboarded.)

- [ ] **Step 1: Onboarding server actions**

Create `apps/web/src/app/onboarding/actions.ts`:
```ts
"use server";

import { redirect } from "next/navigation";
import { getServerCaller } from "../../server/caller";

export async function completeIndividualAction(formData: FormData) {
  const spaceName = String(formData.get("spaceName") ?? "").trim();
  const eventName = String(formData.get("eventName") ?? "").trim();
  const eventTypeKey = String(formData.get("eventTypeKey") ?? "wedding") as
    | "wedding"
    | "birthday"
    | "funeral"
    | "bridal_shower"
    | "corporate";
  if (!spaceName || !eventName) return;
  const res = await (await getServerCaller()).onboarding.completeIndividual({
    spaceName,
    eventTypeKey,
    eventName,
  });
  redirect(`/dashboard/org/${res.organizationId}/event/${res.eventId}`);
}

export async function completeBusinessAction(formData: FormData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  if (!businessName) return;
  await (await getServerCaller()).onboarding.completeBusiness({ businessName });
  redirect("/dashboard");
}
```

- [ ] **Step 2: The fork page**

Create `apps/web/src/app/onboarding/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../server/auth";
import { getServerCaller } from "../../server/caller";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const workspaces = await (await getServerCaller()).workspaces.list();
  if (workspaces.length > 0) redirect("/dashboard");

  return (
    <main>
      <h1>What brings you to Planr?</h1>
      <ul>
        <li>
          <a href="/onboarding/individual">I&apos;m planning my own event</a>
        </li>
        <li>
          <a href="/onboarding/business">I&apos;m an event planner / business</a>
        </li>
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: The individual onboarding page**

Create `apps/web/src/app/onboarding/individual/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../server/auth";
import { completeIndividualAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function IndividualOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const prefill = user.name ? `${user.name}'s Planning` : "My Planning";

  return (
    <main>
      <p>
        <a href="/onboarding">← Back</a>
      </p>
      <h1>Let&apos;s set up your planning</h1>
      <form action={completeIndividualAction}>
        <label>
          Name your space
          <input aria-label="Space name" name="spaceName" defaultValue={prefill} required />
        </label>
        <h2>What are you planning?</h2>
        <label>
          Event type
          <select aria-label="Event type" name="eventTypeKey" defaultValue="wedding">
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="bridal_shower">Baby / bridal shower</option>
            <option value="funeral">Funeral / memorial</option>
            <option value="corporate">Party / other gathering</option>
          </select>
        </label>
        <label>
          Give it a name
          <input aria-label="Event name" name="eventName" required />
        </label>
        <button type="submit">Start planning</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: The business onboarding page**

Create `apps/web/src/app/onboarding/business/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../server/auth";
import { completeBusinessAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function BusinessOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <main>
      <p>
        <a href="/onboarding">← Back</a>
      </p>
      <h1>Set up your business</h1>
      <form action={completeBusinessAction}>
        <label>
          Business name
          <input aria-label="Business name" name="businessName" required />
        </label>
        <button type="submit">Create business</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Typecheck + build**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/web typecheck; echo "tc=$?"
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' \
  NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54421' NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='x' \
  SUPABASE_SECRET_KEY='x' NEXT_PUBLIC_BASE_URL='http://localhost:3000' \
  pnpm --filter @planr/web exec next build 2>&1 | grep -E "onboarding|Compiled|error" | head
```
Expected: tc=0; build compiles `/onboarding`, `/onboarding/individual`, `/onboarding/business`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/onboarding
git commit -m "feat(web): onboarding fork (individual + business) with server actions

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Workspace-framed dashboard home (replace the create-org form)

**Files:** Modify `apps/web/src/app/dashboard/page.tsx`. (Removes the "create an organization" form; routes empty users to onboarding; frames the home by workspace type.)

- [ ] **Step 1: Rewrite the dashboard as a workspace-framed home**

Replace `apps/web/src/app/dashboard/page.tsx` with:
```tsx
import { redirect } from "next/navigation";
import { workspaceTerms } from "@planr/core";
import { getCurrentUser } from "../../server/auth";
import { getServerCaller } from "../../server/caller";
import { createEventAction } from "./actions";
import { SignOutButton } from "../../components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const caller = await getServerCaller();
  const workspaces = await caller.workspaces.list();
  if (workspaces.length === 0) redirect("/onboarding");

  const { w } = await searchParams;
  const current = workspaces.find((ws) => ws.id === w) ?? workspaces[0]!;
  const terms = workspaceTerms(current.type);
  const events = await caller.events.list({ organizationId: current.id });

  return (
    <main>
      <header>
        <h1>{current.name}</h1>
        <span>{user.email ?? "(no email)"}</span>
        <SignOutButton />
      </header>

      {workspaces.length > 1 && (
        <nav aria-label="Workspaces">
          <span>Switch: </span>
          {workspaces.map((ws) => (
            <a key={ws.id} href={`/dashboard?w=${ws.id}`} aria-current={ws.id === current.id}>
              {ws.name}{" "}
            </a>
          ))}
        </nav>
      )}

      <section>
        <h2>{terms.newEvent}</h2>
        <form action={createEventAction}>
          <input type="hidden" name="organizationId" value={current.id} />
          <input aria-label="Event name" name="name" required />
          <select aria-label="Event type" name="eventTypeKey" defaultValue="wedding">
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="bridal_shower">Baby / bridal shower</option>
            <option value="funeral">Funeral / memorial</option>
            <option value="corporate">Party / other gathering</option>
          </select>
          <button type="submit">{terms.newEvent}</button>
        </form>
      </section>

      <section>
        <h2>{terms.eventsHeading} ({events.length})</h2>
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              <a href={`/dashboard/org/${current.id}/event/${e.id}`}>
                {e.name} ({e.eventTypeKey})
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```
> Note: `createEventAction` already revalidates `/dashboard/org/${organizationId}` (Plan 4). Add a `revalidatePath("/dashboard")` to it so the home list refreshes too. In `apps/web/src/app/dashboard/actions.ts`, in `createEventAction` after the create call, add: `revalidatePath("/dashboard");` (keep the existing revalidate).

- [ ] **Step 2: Update createEventAction to also revalidate the home**

In `apps/web/src/app/dashboard/actions.ts`, change the end of `createEventAction`:
```ts
  await (await getServerCaller()).events.create({ organizationId, eventTypeKey, name });
  revalidatePath(`/dashboard/org/${organizationId}`);
  revalidatePath("/dashboard");
}
```

- [ ] **Step 3: Typecheck + build + manual smoke**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/web typecheck; echo "tc=$?"
pnpm lint; echo "lint=$?"
```
Expected: tc=0, lint=0. (Behavioural check is the Task 6 E2E.) The `/dashboard/org/[orgId]/page.tsx` and event page from Plan 4 still exist and still work — they are reached from the home's event links and remain valid.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard
git commit -m "feat(web): workspace-framed home (terminology by type, switcher, no 'organization')

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Playwright E2E — both onboarding paths

**Files:** Create `apps/web/e2e/onboarding.spec.ts`.

- [ ] **Step 1: Write the E2E**

Create `apps/web/e2e/onboarding.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("individual onboarding: sign up → my own event → name space → baby shower → land in event", async ({
  page,
}) => {
  const email = `ind_${Date.now()}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();

  // A brand-new user is routed to onboarding (0 workspaces → /dashboard redirects to /onboarding).
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planning my own event/i }).click();

  await expect(page).toHaveURL(/\/onboarding\/individual$/);
  // The word "organization" must never appear.
  await expect(page.locator("body")).not.toContainText(/organization/i);
  await page.getByLabel("Space name").fill("Ada's Planning");
  await page.getByLabel("Event type").selectOption("bridal_shower");
  await page.getByLabel("Event name").fill("Sarah's Baby Shower");
  await page.getByRole("button", { name: "Start planning" }).click();

  // Lands inside the event's module page.
  await expect(page).toHaveURL(/\/event\/.+/);
  await expect(page.locator('[data-module="guests"]')).toHaveAttribute("data-locked", "false");
  await expect(page.locator('[data-module="seating"]')).toHaveAttribute("data-locked", "true");
});

test("business onboarding: sign up → planner/business → name → dashboard shows the business", async ({
  page,
}) => {
  const email = `biz_${Date.now()}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planner \/ business/i }).click();

  await expect(page).toHaveURL(/\/onboarding\/business$/);
  await page.getByLabel("Business name").fill("Bliss Events");
  await page.getByRole("button", { name: "Create business" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Bliss Events" })).toBeVisible();
  await expect(page.getByText("Create an event")).toBeVisible(); // business terminology
});
```

- [ ] **Step 2: Run the E2E (Supabase + dev server)**

Run (Playwright launches `next dev` via the Plan-4 config; Supabase must be running):
```bash
cd /Users/papii/Planr
lsof -ti:3000 | xargs kill -9 2>/dev/null
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$(supabase status 2>/dev/null | grep -i 'Publishable' | awk '{print $NF}')" \
  pnpm --filter @planr/web run e2e 2>&1 | tail -20
```
Expected: 3 tests passed (the Plan-4 `slice.spec.ts` still passes + the 2 new onboarding tests). If the publishable key isn't picked up, pass it explicitly (see Plan 4 Task 6 notes).

- [ ] **Step 3: Final full gate**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck 2>&1 | grep Tasks:
pnpm lint; echo "lint=$?"
pnpm test 2>&1 | grep "Tests "
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | grep "Tests "
```
Expected: typecheck 4/4, lint=0, offline green, db-int 13, web-int 6.

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/onboarding.spec.ts
git commit -m "test(web): Playwright E2E for individual + business onboarding

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review (against the spec)

**Spec coverage:**
- §3 `Organization.type` + "onboarded = has membership" → Task 1 (field) + Tasks 4/5 (routing: 0 workspaces → /onboarding).
- §4 onboarding wizard (fork; individual names space + first event inline; business names agency) → Tasks 2 (service), 3 (procedures), 4 (UI). Invite step is Plan B (deferred) — not built here, per spec.
- §5 workspace-framed home + terminology + switcher; "organization" never shown → Tasks 2 (terms), 5 (home); the E2E asserts no "organization" text.
- §7 architecture (core services over ports; tRPC behind authedProcedure; Server Components + Actions) → Tasks 2-5.
- §10 success criteria (individual lands inside event; business lands in dashboard; returning user → home; flows under E2E) → Task 6.

**Deferred (per spec):** collaboration/invites (Plan B); per-event sharing, client management, billing-by-type, visual design.

**Placeholder scan:** none — every step has complete code/commands.

**Type consistency:** `OrgType` defined once in `types.ts` (Task 1), used in `OrganizationRecord`, `create`, `provisionOrganization`, the adapter, `workspaceTerms`, and `OnboardingService`. `completeIndividual`/`completeBusiness` signatures match between the service (Task 2), the tRPC procedures (Task 3), and their tests. `workspaceTerms` keys (`newEvent`, `members`, `invite`, `eventsHeading`) match between the helper (Task 2) and the dashboard (Task 5). The `eventTypeKey` z.enum matches the Plan-1 `EventTypeKey` union. The container shape (adds `onboarding`) is updated in both `container.ts` (Task 3) and the int test's `ctxFor` (Task 3).
