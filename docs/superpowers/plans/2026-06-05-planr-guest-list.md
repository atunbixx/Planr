# Planr Guest List — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Guest List — add/edit/remove guests per event with a live RSVP summary — as an enterprise-grade, entitlement-gated (free-now, lockable-later) vertical slice that becomes the template every later feature copies.

**Architecture:** One slice through the fixed layers (page/action → tRPC → `GuestService` (core) → `GuestRepository` port → `PrismaGuestRepository` (the only SQL) → Postgres). Adds two reusable foundations the spec mandates: typed domain errors mapped to tRPC codes, and a single module **gate** (`freeLaunch` flag) so the lock is wired from day one but open now. Reads are paginated; the summary is an aggregate `GROUP BY`.

**Tech Stack:** Prisma 6 + Supabase Postgres, `@planr/core` (framework-free), tRPC v11, Next.js 15 (Server Components + Server Actions), Zod, Vitest, Playwright.

**Reference spec:** `docs/superpowers/specs/2026-06-05-planr-guest-list-design.md`.
**Builds on:** Plans 1-5 + A + B (branch `foundation-redesign`). Local Supabase up (`supabase start`; DB `postgresql://postgres:postgres@127.0.0.1:54422/postgres`). Dev server + E2E on **port 3100**.

**Environment facts:** pnpm 10.32.1; `TEST_DATABASE_URL`/`DATABASE_URL` = the local Supabase Postgres; `prisma generate` needs `DATABASE_URL` defined; publishable key via `supabase status | grep -oE 'sb_publishable_[A-Za-z0-9_]+'`.

---

## File structure (locked)

```
packages/core/src/errors.ts                              # NotFoundError, ForbiddenError (Task 1)
packages/core/src/services/authorization.service.ts      # throw ForbiddenError (Task 1)
packages/core/src/index.ts                               # barrel exports (Tasks 1,3,4)
apps/web/src/server/trpc.ts                              # map domain errors → tRPC codes (Task 1)

packages/core/src/types.ts                               # RsvpStatus (Task 2)
packages/db/prisma/schema.prisma                         # Guest model + RsvpStatus + back-relations (Task 2)
packages/db/prisma/migrations/<ts>_guest/migration.sql   (Task 2)

packages/core/src/ports/repositories.ts                  # GuestRecord, GuestRepository, EventRepository.getById (Task 3)
packages/core/src/guests/guest.dto.ts                    # guestInput Zod + GuestSummary (Task 3)
packages/core/src/testing/fakes.ts                       # fake guests repo + events.getById (Task 3)

packages/core/src/billing/launch.ts                      # FREE_LAUNCH flag (Task 4)
packages/core/src/guests/guest.service.ts                # makeGuestService + module gate (Task 4)
packages/core/src/guests/guest.service.test.ts

packages/db/src/repositories/guest.repository.ts         # Prisma adapter (Task 5)
packages/db/src/repositories/event.repository.ts         # + getById (Task 5)
packages/db/src/repositories/index.ts                    # wire guests repo (Task 5)
packages/db/src/repositories/guests.int.test.ts          # adapter integration tests (Task 5)

apps/web/src/server/container.ts                         # + guests service (Task 6)
apps/web/src/server/routers/app.ts                       # guests router (Task 6)
apps/web/src/server/routers/app.int.test.ts              # integration tests (Task 6)

apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/page.tsx        # toolkit: link/coming-soon (Task 7)
apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/guests/page.tsx # Guests page (Task 7)
apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/guests/actions.ts
apps/web/src/app/globals.css                             # guest table styles (Task 7)
apps/web/e2e/guests.spec.ts                              # E2E (Task 8)
```

---

## Task 1: Typed domain errors + tRPC error mapping (reusable foundation)

**Files:** Create `packages/core/src/errors.ts`; modify `packages/core/src/services/authorization.service.ts`, `packages/core/src/index.ts`, `apps/web/src/server/trpc.ts`. Test: `packages/core/src/errors.test.ts`.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/errors.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { NotFoundError, ForbiddenError } from "./errors";

describe("domain errors", () => {
  it("NotFoundError carries a message and a stable name", () => {
    const e = new NotFoundError("Guest not found");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("NotFoundError");
    expect(e.message).toBe("Guest not found");
  });

  it("ForbiddenError carries a message and a stable name", () => {
    const e = new ForbiddenError("Forbidden: nope");
    expect(e.name).toBe("ForbiddenError");
    expect(e.message).toMatch(/forbidden/i);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL**

Run: `pnpm --filter @planr/core test` → cannot find `./errors`.

- [ ] **Step 3: Implement the errors**

Create `packages/core/src/errors.ts`:
```ts
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
```

- [ ] **Step 4: Authorization service throws typed errors (messages preserved)**

Rewrite `packages/core/src/services/authorization.service.ts`:
```ts
import type { Repositories } from "../ports/repositories";
import type { Role, Permission } from "../types";
import { roleHasPermission } from "../rbac/policy";
import { ForbiddenError } from "../errors";

export function makeAuthorizationService(repos: Repositories) {
  return {
    async requireMembership(userId: string, organizationId: string): Promise<Role> {
      const membership = await repos.memberships.find({ organizationId, userId });
      if (!membership) {
        throw new ForbiddenError(`User is not a member of organization "${organizationId}".`);
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
        throw new ForbiddenError(`Forbidden: role "${role}" lacks permission "${permission}".`);
      }
      return role;
    },
  };
}

export type AuthorizationService = ReturnType<typeof makeAuthorizationService>;
```
(The thrown messages still contain "not a member" / "Forbidden", so the existing authorization & collaboration tests — which match `/not a member/i` and `/forbidden/i` — keep passing.)

- [ ] **Step 5: Export errors from the barrel**

Append to `packages/core/src/index.ts`:
```ts
export { NotFoundError, ForbiddenError } from "./errors";
```

- [ ] **Step 6: Map domain errors to tRPC codes (global middleware)**

In `apps/web/src/server/trpc.ts`, add an error-mapping middleware and apply it to the base procedures. Replace the procedure definitions:
```ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { NotFoundError, ForbiddenError, type UserRecord } from "@planr/core";
import { container, type Container } from "./container";

export interface TrpcContext {
  user: UserRecord | null;
  container: Container;
}

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

const mapErrors = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw new TRPCError({ code: "NOT_FOUND", message: err.message, cause: err });
    }
    if (err instanceof ForbiddenError) {
      throw new TRPCError({ code: "FORBIDDEN", message: err.message, cause: err });
    }
    throw err;
  }
});

export const router = t.router;
export const publicProcedure = t.procedure.use(mapErrors);
export const authedProcedure = t.procedure.use(mapErrors).use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export function makeContext(user: UserRecord | null): TrpcContext {
  return { user, container };
}
```

- [ ] **Step 7: Verify**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck 2>&1 | grep Tasks:
pnpm test 2>&1 | grep "Tests "
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | grep "Tests "
```
Expected: typecheck 4/4; offline +2 (errors tests); web-int 8 (existing collaboration "forbids non-owner" now surfaces FORBIDDEN — still rejects with /forbidden/i, passes).

- [ ] **Step 8: Commit**

```bash
git add packages/core apps/web/src/server/trpc.ts
git commit -m "feat(core,web): typed domain errors (NotFound/Forbidden) mapped to tRPC codes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Guest schema + migration

**Files:** Modify `packages/core/src/types.ts`, `packages/db/prisma/schema.prisma`; create a migration.

- [ ] **Step 1: Domain type**

In `packages/core/src/types.ts`, add after `InvitationStatus`:
```ts
export type RsvpStatus = "awaiting" | "coming" | "declined" | "maybe";
```

- [ ] **Step 2: Prisma enum + model + back-relations**

In `packages/db/prisma/schema.prisma`, add the enum near the others:
```prisma
enum RsvpStatus {
  awaiting
  coming
  declined
  maybe
}
```
Add a back-relation to `Organization` (after `invitations   Invitation[]`):
```prisma
  guests        Guest[]
```
Add a back-relation to `Event` (after its `entitlements Entitlement[]`):
```prisma
  guests         Guest[]
```
Add the model (after `Invitation`):
```prisma
model Guest {
  id             String       @id @default(uuid())
  organizationId String
  eventId        String
  name           String
  email          String?
  phone          String?
  groupLabel     String?
  plusOne        Boolean      @default(false)
  rsvpStatus     RsvpStatus   @default(awaiting)
  notes          String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  event          Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@index([organizationId, eventId])
  @@index([eventId, rsvpStatus])
}
```

- [ ] **Step 3: Migration**

Create `packages/db/prisma/migrations/20260605160000_guest/migration.sql`:
```sql
CREATE TYPE "RsvpStatus" AS ENUM ('awaiting', 'coming', 'declined', 'maybe');

CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "groupLabel" TEXT,
    "plusOne" BOOLEAN NOT NULL DEFAULT false,
    "rsvpStatus" "RsvpStatus" NOT NULL DEFAULT 'awaiting',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");
CREATE INDEX "Guest_organizationId_eventId_idx" ON "Guest"("organizationId", "eventId");
CREATE INDEX "Guest_eventId_rsvpStatus_idx" ON "Guest"("eventId", "rsvpStatus");

ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```
Apply + regenerate:
```bash
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' \
  pnpm --filter @planr/db exec prisma migrate deploy --schema prisma/schema.prisma
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
```
Expected: "All migrations have been successfully applied".

- [ ] **Step 4: Verify schema + commit**

Run `pnpm typecheck 2>&1 | grep Tasks:` (4/4) and `pnpm test 2>&1 | grep "Tests "` (green). Commit:
```bash
git add packages/core/src/types.ts packages/db/prisma
git commit -m "feat(db): Guest model + RsvpStatus enum (tenant-scoped, indexed, cascade)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Guest port + validation DTO + fakes; Event.getById

**Files:** Modify `packages/core/src/ports/repositories.ts`, `packages/core/src/testing/fakes.ts`, `packages/core/src/index.ts`; create `packages/core/src/guests/guest.dto.ts`, `packages/core/src/guests/guest.dto.test.ts`.

- [ ] **Step 1: Ports — record, repository, Event.getById**

In `packages/core/src/ports/repositories.ts`:
- Add `RsvpStatus` to the type import: `import type { Role, EventTypeKey, Entitlement, OrgType, InvitationStatus, RsvpStatus } from "../types";`
- Add `getById` to `EventRepository` (after `findById`):
```ts
  getById(id: string): Promise<EventRecord | null>;
```
- Add the guest record + repository (after `InvitationRepository`):
```ts
export interface GuestRecord {
  id: string;
  organizationId: string;
  eventId: string;
  name: string;
  email: string | null;
  phone: string | null;
  groupLabel: string | null;
  plusOne: boolean;
  rsvpStatus: RsvpStatus;
  notes: string | null;
}

export interface GuestSummary {
  total: number;
  coming: number;
  declined: number;
  maybe: number;
  awaiting: number;
}

export interface GuestWrite {
  name: string;
  email: string | null;
  phone: string | null;
  groupLabel: string | null;
  plusOne: boolean;
  rsvpStatus: RsvpStatus;
  notes: string | null;
}

export interface GuestRepository {
  create(input: { organizationId: string; eventId: string } & GuestWrite): Promise<GuestRecord>;
  listByEvent(input: {
    organizationId: string;
    eventId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ guests: GuestRecord[]; nextCursor: string | null }>;
  getById(input: { organizationId: string; eventId: string; id: string }): Promise<GuestRecord | null>;
  update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<GuestWrite>;
  }): Promise<GuestRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  summaryByEvent(input: { organizationId: string; eventId: string }): Promise<GuestSummary>;
}
```
- Add `guests` to `Repositories`:
```ts
  invitations: InvitationRepository;
  guests: GuestRepository;
}
```

- [ ] **Step 2: Validation DTO test**

Create `packages/core/src/guests/guest.dto.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { guestInput, toGuestWrite } from "./guest.dto";

describe("guestInput", () => {
  it("accepts a minimal valid guest and normalises optionals to null", () => {
    const parsed = guestInput.parse({ name: "Aunt Mary" });
    const write = toGuestWrite(parsed);
    expect(write).toEqual({
      name: "Aunt Mary",
      email: null,
      phone: null,
      groupLabel: null,
      plusOne: false,
      rsvpStatus: "awaiting",
      notes: null,
    });
  });

  it("rejects an empty name", () => {
    expect(() => guestInput.parse({ name: "" })).toThrow();
  });

  it("rejects an invalid email but accepts a blank one", () => {
    expect(() => guestInput.parse({ name: "X", email: "not-an-email" })).toThrow();
    expect(toGuestWrite(guestInput.parse({ name: "X", email: "" })).email).toBeNull();
  });

  it("rejects an unknown rsvp status", () => {
    expect(() => guestInput.parse({ name: "X", rsvpStatus: "nope" })).toThrow();
  });
});
```

- [ ] **Step 3: Implement the DTO**

Create `packages/core/src/guests/guest.dto.ts`:
```ts
import { z } from "zod";
import type { GuestWrite } from "../ports/repositories";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const guestInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.preprocess(blankToNull, z.string().email().max(200).nullish()),
  phone: z.preprocess(blankToNull, z.string().max(40).nullish()),
  groupLabel: z.preprocess(blankToNull, z.string().max(80).nullish()),
  plusOne: z.boolean().optional(),
  rsvpStatus: z.enum(["awaiting", "coming", "declined", "maybe"]).optional(),
  notes: z.preprocess(blankToNull, z.string().max(2000).nullish()),
});

export type GuestInput = z.infer<typeof guestInput>;

/** Normalise a parsed input into a full GuestWrite (optionals → null / defaults). */
export function toGuestWrite(input: GuestInput): GuestWrite {
  return {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    groupLabel: input.groupLabel ?? null,
    plusOne: input.plusOne ?? false,
    rsvpStatus: input.rsvpStatus ?? "awaiting",
    notes: input.notes ?? null,
  };
}

/** Partial patch (for updates): only the provided fields, normalised. */
export function toGuestPatch(input: Partial<GuestInput>): Partial<GuestWrite> {
  const patch: Partial<GuestWrite> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.email !== undefined) patch.email = input.email ?? null;
  if (input.phone !== undefined) patch.phone = input.phone ?? null;
  if (input.groupLabel !== undefined) patch.groupLabel = input.groupLabel ?? null;
  if (input.plusOne !== undefined) patch.plusOne = input.plusOne;
  if (input.rsvpStatus !== undefined) patch.rsvpStatus = input.rsvpStatus;
  if (input.notes !== undefined) patch.notes = input.notes ?? null;
  return patch;
}
```

- [ ] **Step 4: Fakes — events.getById + guests repo**

In `packages/core/src/testing/fakes.ts`:
- Add `GuestRecord` to the imports.
- Add a backing array: `const guests: GuestRecord[] = [];`
- Add `getById` to the `events` fake (after `findById`):
```ts
      async getById(eventId) {
        const found = events.find((e) => e.id === eventId);
        return found ? { ...found } : null;
      },
```
- Add a `guests` repo to the returned object (after `invitations`):
```ts
    guests: {
      async create({ organizationId, eventId, ...rest }) {
        const created: GuestRecord = { id: id("gst"), organizationId, eventId, ...rest };
        guests.push(created);
        return { ...created };
      },
      async listByEvent({ organizationId, eventId, limit, cursor }) {
        const all = guests
          .filter((g) => g.organizationId === organizationId && g.eventId === eventId)
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        const start = cursor ? all.findIndex((g) => g.id === cursor) + 1 : 0;
        const page = all.slice(start, start + limit);
        const nextCursor = page.length === limit && start + limit < all.length ? page[page.length - 1]!.id : null;
        return { guests: page.map((g) => ({ ...g })), nextCursor };
      },
      async getById({ organizationId, eventId, id: gid }) {
        const found = guests.find(
          (g) => g.id === gid && g.organizationId === organizationId && g.eventId === eventId,
        );
        return found ? { ...found } : null;
      },
      async update({ organizationId, eventId, id: gid, patch }) {
        const g = guests.find(
          (x) => x.id === gid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (!g) return null;
        Object.assign(g, patch);
        return { ...g };
      },
      async remove({ organizationId, eventId, id: gid }) {
        const i = guests.findIndex(
          (x) => x.id === gid && x.organizationId === organizationId && x.eventId === eventId,
        );
        if (i < 0) return false;
        guests.splice(i, 1);
        return true;
      },
      async summaryByEvent({ organizationId, eventId }) {
        const mine = guests.filter((g) => g.organizationId === organizationId && g.eventId === eventId);
        return {
          total: mine.length,
          coming: mine.filter((g) => g.rsvpStatus === "coming").length,
          declined: mine.filter((g) => g.rsvpStatus === "declined").length,
          maybe: mine.filter((g) => g.rsvpStatus === "maybe").length,
          awaiting: mine.filter((g) => g.rsvpStatus === "awaiting").length,
        };
      },
    },
  };
}
```
(Note: the fake's keyset is id-ordered for determinism; the Prisma adapter orders by `(createdAt, id)` — both stable. The list test asserts page sizes/cursor, not a specific global order.)

- [ ] **Step 5: Barrel exports + run**

Append to `packages/core/src/index.ts`:
```ts
export type {
  GuestRecord,
  GuestSummary,
  GuestWrite,
  GuestRepository,
} from "./ports/repositories";
export { guestInput, toGuestWrite, toGuestPatch, type GuestInput } from "./guests/guest.dto";
```
Run `pnpm --filter @planr/core test` (4 new DTO tests pass) and `pnpm --filter @planr/core typecheck` (0).

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): Guest port + validation DTO + fakes; Event.getById

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: GuestService + module gate (free-now, lockable-later)

**Files:** Create `packages/core/src/billing/launch.ts`, `packages/core/src/guests/guest.service.ts`, `packages/core/src/guests/guest.service.test.ts`; modify `packages/core/src/index.ts`.

- [ ] **Step 1: The launch flag**

Create `packages/core/src/billing/launch.ts`:
```ts
/**
 * Planr launches free. While this is true, every relevant module resolves as available
 * regardless of entitlements. Monetising = set this false and configure plans; the same
 * gate then enforces entitlements with NO feature changes.
 */
export const FREE_LAUNCH = true;
```

- [ ] **Step 2: Write the failing service test**

Create `packages/core/src/guests/guest.service.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeGuestService } from "./guest.service";

async function setup(opts: { freeLaunch?: boolean } = {}) {
  const repos = makeFakeRepositories();
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);
  const { organization, ownerMembership } = await tenancy.provisionOrganization({
    name: "Smith Wedding",
    creator: { authUserId: "auth_owner", email: "owner@x.com", name: "Owner" },
  });
  const event = await events.create({
    organizationId: organization.id,
    eventTypeKey: "wedding",
    name: "Our Wedding",
    date: null,
  });
  const guestSvc = makeGuestService(repos, { freeLaunch: opts.freeLaunch ?? true });
  return { repos, organization, event, ownerUserId: ownerMembership.userId, guestSvc };
}

describe("guest service", () => {
  it("creates, lists and summarises guests for a member", async () => {
    const { guestSvc, event, ownerUserId } = await setup();
    await guestSvc.create(ownerUserId, {
      eventId: event.id,
      guest: { name: "Aunt Mary", rsvpStatus: "coming" },
    });
    await guestSvc.create(ownerUserId, { eventId: event.id, guest: { name: "Uncle Joe" } });
    const page = await guestSvc.list(ownerUserId, { eventId: event.id, limit: 50 });
    expect(page.guests).toHaveLength(2);
    const summary = await guestSvc.summary(ownerUserId, { eventId: event.id });
    expect(summary).toMatchObject({ total: 2, coming: 1, awaiting: 1 });
  });

  it("paginates with a cursor", async () => {
    const { guestSvc, event, ownerUserId } = await setup();
    for (let i = 0; i < 3; i++) {
      await guestSvc.create(ownerUserId, { eventId: event.id, guest: { name: `G${i}` } });
    }
    const first = await guestSvc.list(ownerUserId, { eventId: event.id, limit: 2 });
    expect(first.guests).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await guestSvc.list(ownerUserId, {
      eventId: event.id,
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.guests).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it("updates and removes a guest", async () => {
    const { guestSvc, event, ownerUserId } = await setup();
    const g = await guestSvc.create(ownerUserId, { eventId: event.id, guest: { name: "Mary" } });
    const updated = await guestSvc.update(ownerUserId, {
      eventId: event.id,
      guestId: g.id,
      patch: { rsvpStatus: "declined" },
    });
    expect(updated.rsvpStatus).toBe("declined");
    await guestSvc.remove(ownerUserId, { eventId: event.id, guestId: g.id });
    const page = await guestSvc.list(ownerUserId, { eventId: event.id, limit: 50 });
    expect(page.guests).toHaveLength(0);
  });

  it("throws NotFound for an unknown event or guest", async () => {
    const { guestSvc, event, ownerUserId } = await setup();
    await expect(guestSvc.list(ownerUserId, { eventId: "nope", limit: 10 })).rejects.toThrowError(
      /not found/i,
    );
    await expect(
      guestSvc.update(ownerUserId, { eventId: event.id, guestId: "nope", patch: { name: "x" } }),
    ).rejects.toThrowError(/not found/i);
  });

  it("forbids a non-member (cross-tenant) from reading or writing", async () => {
    const { guestSvc, event, repos } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({
      authUserId: "auth_stranger",
      email: "s@x.com",
      name: null,
    });
    await expect(
      guestSvc.list(stranger.id, { eventId: event.id, limit: 10 }),
    ).rejects.toThrowError(/member|forbidden/i);
    await expect(
      guestSvc.create(stranger.id, { eventId: event.id, guest: { name: "Hax" } }),
    ).rejects.toThrowError(/member|forbidden/i);
  });

  it("a viewer can read but not write", async () => {
    const { guestSvc, event, organization, repos } = await setup();
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(guestSvc.list(viewer.id, { eventId: event.id, limit: 10 })).resolves.toBeDefined();
    await expect(
      guestSvc.create(viewer.id, { eventId: event.id, guest: { name: "x" } }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("locks the module when freeLaunch is off and no entitlement is held", async () => {
    const { guestSvc: free, event, ownerUserId } = await setup({ freeLaunch: true });
    await expect(free.list(ownerUserId, { eventId: event.id, limit: 10 })).resolves.toBeDefined();

    const { guestSvc: paid, event: ev2, ownerUserId: owner2 } = await setup({ freeLaunch: false });
    await expect(paid.list(owner2, { eventId: ev2.id, limit: 10 })).rejects.toThrowError(/locked/i);
  });
});
```

- [ ] **Step 3: Run, confirm FAIL**

Run: `pnpm --filter @planr/core test` → cannot find `./guest.service`.

- [ ] **Step 4: Implement the service**

Create `packages/core/src/guests/guest.service.ts`:
```ts
import type { Repositories, GuestRecord, GuestSummary, EventRecord } from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import { guestInput, toGuestWrite, toGuestPatch, type GuestInput } from "./guest.dto";
import { FREE_LAUNCH } from "../billing/launch";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export function makeGuestService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  /** Resolve the event, assert the caller is a member, and assert the "guests" module is available. */
  async function gateRead(userId: string, eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    await authz.requireMembership(userId, event.organizationId);
    await assertModuleAvailable(event);
    return event;
  }

  async function gateWrite(userId: string, eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    await authz.requirePermission(userId, event.organizationId, "content:edit");
    await assertModuleAvailable(event);
    return event;
  }

  async function assertModuleAvailable(event: EventRecord): Promise<void> {
    if (freeLaunch) return; // launch: everything available; the gate stays wired for later
    const held = await repos.entitlements.heldFor({
      organizationId: event.organizationId,
      eventId: event.id,
    });
    const access = resolveModuleAccess({ module: "guests", eventType: event.eventTypeKey, held });
    if (access.locked) {
      throw new ForbiddenError(`The guests module is locked (${access.reason}).`);
    }
  }

  return {
    async summary(userId: string, input: { eventId: string }): Promise<GuestSummary> {
      const event = await gateRead(userId, input.eventId);
      return repos.guests.summaryByEvent({ organizationId: event.organizationId, eventId: event.id });
    },

    async list(
      userId: string,
      input: { eventId: string; limit?: number; cursor?: string },
    ): Promise<{ guests: GuestRecord[]; nextCursor: string | null }> {
      const event = await gateRead(userId, input.eventId);
      const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
      return repos.guests.listByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
        limit,
        cursor: input.cursor,
      });
    },

    async create(
      userId: string,
      input: { eventId: string; guest: GuestInput },
    ): Promise<GuestRecord> {
      const event = await gateWrite(userId, input.eventId);
      const write = toGuestWrite(guestInput.parse(input.guest));
      return repos.guests.create({ organizationId: event.organizationId, eventId: event.id, ...write });
    },

    async update(
      userId: string,
      input: { eventId: string; guestId: string; patch: Partial<GuestInput> },
    ): Promise<GuestRecord> {
      const event = await gateWrite(userId, input.eventId);
      const patch = toGuestPatch(guestInput.partial().parse(input.patch));
      const updated = await repos.guests.update({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.guestId,
        patch,
      });
      if (!updated) throw new NotFoundError("Guest not found.");
      return updated;
    },

    async remove(userId: string, input: { eventId: string; guestId: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.guests.remove({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.guestId,
      });
      if (!ok) throw new NotFoundError("Guest not found.");
    },
  };
}

export type GuestService = ReturnType<typeof makeGuestService>;
```

- [ ] **Step 5: Barrel + run**

Append to `packages/core/src/index.ts`:
```ts
export { makeGuestService, type GuestService } from "./guests/guest.service";
export { FREE_LAUNCH } from "./billing/launch";
```
Run `pnpm --filter @planr/core test` (7 new service tests pass) and `pnpm --filter @planr/core typecheck` (0).

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): GuestService with module gate (free-now, lockable-later) + typed errors

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Prisma Guest adapter + Event.getById adapter + integration tests

**Files:** Create `packages/db/src/repositories/guest.repository.ts`, `packages/db/src/repositories/guests.int.test.ts`; modify `packages/db/src/repositories/event.repository.ts`, `packages/db/src/repositories/index.ts`.

- [ ] **Step 1: Event adapter — getById**

In `packages/db/src/repositories/event.repository.ts`, add to the class (after `findById`):
```ts
  async getById(id: string): Promise<EventRecord | null> {
    const row = await this.prisma.event.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }
```

- [ ] **Step 2: Guest adapter**

Create `packages/db/src/repositories/guest.repository.ts`:
```ts
import type {
  GuestRepository,
  GuestRecord,
  GuestSummary,
  GuestWrite,
  RsvpStatus,
} from "@planr/core";
import type { PrismaClient } from "../generated/client";

function toRecord(row: {
  id: string;
  organizationId: string;
  eventId: string;
  name: string;
  email: string | null;
  phone: string | null;
  groupLabel: string | null;
  plusOne: boolean;
  rsvpStatus: string;
  notes: string | null;
}): GuestRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    eventId: row.eventId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    groupLabel: row.groupLabel,
    plusOne: row.plusOne,
    rsvpStatus: row.rsvpStatus as RsvpStatus,
    notes: row.notes,
  };
}

export class PrismaGuestRepository implements GuestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { organizationId: string; eventId: string } & GuestWrite): Promise<GuestRecord> {
    const row = await this.prisma.guest.create({ data: input });
    return toRecord(row);
  }

  async listByEvent(input: {
    organizationId: string;
    eventId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ guests: GuestRecord[]; nextCursor: string | null }> {
    const rows = await this.prisma.guest.findMany({
      where: { organizationId: input.organizationId, eventId: input.eventId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: input.limit + 1, // fetch one extra to know if there's a next page
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    return {
      guests: page.map(toRecord),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  async getById(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<GuestRecord | null> {
    const row = await this.prisma.guest.findFirst({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return row ? toRecord(row) : null;
  }

  async update(input: {
    organizationId: string;
    eventId: string;
    id: string;
    patch: Partial<GuestWrite>;
  }): Promise<GuestRecord | null> {
    const result = await this.prisma.guest.updateMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
      data: input.patch,
    });
    if (result.count === 0) return null;
    return this.getById({ organizationId: input.organizationId, eventId: input.eventId, id: input.id });
  }

  async remove(input: {
    organizationId: string;
    eventId: string;
    id: string;
  }): Promise<boolean> {
    const result = await this.prisma.guest.deleteMany({
      where: { id: input.id, organizationId: input.organizationId, eventId: input.eventId },
    });
    return result.count > 0;
  }

  async summaryByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<GuestSummary> {
    const groups = await this.prisma.guest.groupBy({
      by: ["rsvpStatus"],
      where: { organizationId: input.organizationId, eventId: input.eventId },
      _count: { _all: true },
    });
    const count = (s: string) => groups.find((g) => g.rsvpStatus === s)?._count._all ?? 0;
    const coming = count("coming");
    const declined = count("declined");
    const maybe = count("maybe");
    const awaiting = count("awaiting");
    return { total: coming + declined + maybe + awaiting, coming, declined, maybe, awaiting };
  }
}
```
> Note: `update`/`remove` use `updateMany`/`deleteMany` with the full tenant filter so a guest from another tenant is never touched (defence in depth — no IDOR), then re-read.

- [ ] **Step 3: Wire the factory**

In `packages/db/src/repositories/index.ts`, import and add:
```ts
import { PrismaGuestRepository } from "./guest.repository";
```
and in the returned object:
```ts
    invitations: new PrismaInvitationRepository(prisma),
    guests: new PrismaGuestRepository(prisma),
  };
```

- [ ] **Step 4: Integration tests**

Create `packages/db/src/repositories/guests.int.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestDb, type TestDb } from "../testing/test-db";
import { createRepositories } from "./index";

let db: TestDb;
let repos: ReturnType<typeof createRepositories>;

async function makeEvent(name: string) {
  const org = await repos.orgs.create({ name });
  const event = await repos.events.create({
    organizationId: org.id,
    eventTypeKey: "wedding",
    name: `${name} day`,
    date: null,
  });
  return { orgId: org.id, eventId: event.id };
}

const base = (orgId: string, eventId: string, name: string) => ({
  organizationId: orgId,
  eventId,
  name,
  email: null,
  phone: null,
  groupLabel: null,
  plusOne: false,
  rsvpStatus: "awaiting" as const,
  notes: null,
});

beforeAll(async () => {
  db = await startTestDb();
  repos = createRepositories(db.prisma);
});
afterAll(async () => {
  await db?.stop();
});

describe("Prisma guest repository", () => {
  it("creates, finds (tenant-scoped), updates and removes", async () => {
    const { orgId, eventId } = await makeEvent("CRUD");
    const g = await repos.guests.create({ ...base(orgId, eventId, "Mary"), rsvpStatus: "coming" });
    expect(g.rsvpStatus).toBe("coming");
    expect(await repos.guests.getById({ organizationId: orgId, eventId, id: g.id })).toMatchObject({
      name: "Mary",
    });
    // wrong org → not found (no IDOR)
    expect(await repos.guests.getById({ organizationId: "other", eventId, id: g.id })).toBeNull();
    const updated = await repos.guests.update({
      organizationId: orgId,
      eventId,
      id: g.id,
      patch: { rsvpStatus: "declined", notes: "Can't make it" },
    });
    expect(updated).toMatchObject({ rsvpStatus: "declined", notes: "Can't make it" });
    expect(await repos.guests.remove({ organizationId: orgId, eventId, id: g.id })).toBe(true);
    expect(await repos.guests.remove({ organizationId: orgId, eventId, id: g.id })).toBe(false);
  });

  it("paginates by keyset cursor", async () => {
    const { orgId, eventId } = await makeEvent("Page");
    for (let i = 0; i < 5; i++) {
      await repos.guests.create(base(orgId, eventId, `G${i}`));
    }
    const first = await repos.guests.listByEvent({ organizationId: orgId, eventId, limit: 2 });
    expect(first.guests).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await repos.guests.listByEvent({
      organizationId: orgId,
      eventId,
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.guests).toHaveLength(2);
    const third = await repos.guests.listByEvent({
      organizationId: orgId,
      eventId,
      limit: 2,
      cursor: second.nextCursor!,
    });
    expect(third.guests).toHaveLength(1);
    expect(third.nextCursor).toBeNull();
  });

  it("summarises by rsvp status with aggregate counts", async () => {
    const { orgId, eventId } = await makeEvent("Sum");
    await repos.guests.create({ ...base(orgId, eventId, "A"), rsvpStatus: "coming" });
    await repos.guests.create({ ...base(orgId, eventId, "B"), rsvpStatus: "coming" });
    await repos.guests.create({ ...base(orgId, eventId, "C"), rsvpStatus: "declined" });
    await repos.guests.create(base(orgId, eventId, "D")); // awaiting
    const s = await repos.guests.summaryByEvent({ organizationId: orgId, eventId });
    expect(s).toEqual({ total: 4, coming: 2, declined: 1, maybe: 0, awaiting: 1 });
  });

  it("cascades: deleting the event removes its guests", async () => {
    const { orgId, eventId } = await makeEvent("Cascade");
    await repos.guests.create(base(orgId, eventId, "X"));
    await db.prisma.event.delete({ where: { id: eventId } });
    const s = await repos.guests.summaryByEvent({ organizationId: orgId, eventId });
    expect(s.total).toBe(0);
  });
});
```

- [ ] **Step 5: Verify**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck 2>&1 | grep Tasks:
pnpm test 2>&1 | grep "Tests "
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
```
Expected: typecheck 4/4; offline green; db-int +4 (the new guests file).

- [ ] **Step 6: Commit**

```bash
git add packages/db
git commit -m "feat(db): Prisma Guest repository (keyset pagination, aggregate summary) + Event.getById

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: tRPC guests router + container wiring + integration tests

**Files:** Modify `apps/web/src/server/container.ts`, `apps/web/src/server/routers/app.ts`, `apps/web/src/server/routers/app.int.test.ts`.

- [ ] **Step 1: Container**

In `apps/web/src/server/container.ts`, add `makeGuestService` to the import and the container (after `collaboration`):
```ts
  collaboration: makeCollaborationService(repos),
  guests: makeGuestService(repos),
```
(`makeGuestService(repos)` uses the default `FREE_LAUNCH` flag.)

- [ ] **Step 2: Router**

In `apps/web/src/server/routers/app.ts`, add `guestInput` to the `@planr/core` import (the router shares the core validation contract):
```ts
import { guestInput } from "@planr/core";
```
Add a `guests` router key:
```ts
  guests: router({
    summary: authedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) => ctx.container.guests.summary(ctx.user.id, input)),
    list: authedProcedure
      .input(z.object({ eventId: z.string(), cursor: z.string().optional(), limit: z.number().int().min(1).max(100).optional() }))
      .query(({ ctx, input }) => ctx.container.guests.list(ctx.user.id, input)),
    create: authedProcedure
      .input(z.object({ eventId: z.string(), guest: guestInput }))
      .mutation(({ ctx, input }) => ctx.container.guests.create(ctx.user.id, input)),
    update: authedProcedure
      .input(z.object({ eventId: z.string(), guestId: z.string(), patch: guestInput.partial() }))
      .mutation(({ ctx, input }) => ctx.container.guests.update(ctx.user.id, input)),
    remove: authedProcedure
      .input(z.object({ eventId: z.string(), guestId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.container.guests.remove(ctx.user.id, input);
        return { ok: true as const };
      }),
  }),
```

- [ ] **Step 3: Integration test container + tests**

In `apps/web/src/server/routers/app.int.test.ts`, add `makeGuestService` to the `@planr/core` import and to `ctxFor`'s container:
```ts
      collaboration: makeCollaborationService(repos),
      guests: makeGuestService(repos),
```
Add tests inside the `describe`:
```ts
  it("guests: a member creates, lists and summarises", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_gu", email: "gu@x.com", name: "Gu" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Guest Co" });
    const event = await caller.events.create({ organizationId: org.id, eventTypeKey: "wedding", name: "Day" });
    await caller.guests.create({ eventId: event.id, guest: { name: "Mary", rsvpStatus: "coming" } });
    await caller.guests.create({ eventId: event.id, guest: { name: "Joe" } });
    const page = await caller.guests.list({ eventId: event.id });
    expect(page.guests).toHaveLength(2);
    expect(await caller.guests.summary({ eventId: event.id })).toMatchObject({ total: 2, coming: 1 });
  });

  it("guests: a non-member is forbidden", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_go", email: "go@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Private Guests" });
    const event = await ownerCaller.events.create({ organizationId: org.id, eventTypeKey: "wedding", name: "D" });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_gs", email: "gs@x.com", name: null });
    const strangerCaller = appRouter.createCaller(ctxFor(stranger));
    await expect(strangerCaller.guests.list({ eventId: event.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("guests: invalid input is rejected", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_gi", email: "gi@x.com", name: null });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Valid Co" });
    const event = await caller.events.create({ organizationId: org.id, eventTypeKey: "wedding", name: "D" });
    await expect(caller.guests.create({ eventId: event.id, guest: { name: "" } })).rejects.toBeDefined();
  });
```

- [ ] **Step 4: Verify**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/web typecheck; echo "tc=$?"
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | grep "Tests "
```
Expected: tc=0; web-int +3.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/server
git commit -m "feat(web): tRPC guests router (summary/list/create/update/remove) + integration tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Guests page + actions; event toolkit linking; free-launch tile states

**Files:** Create `apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/guests/page.tsx`, `.../guests/actions.ts`; modify `apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/page.tsx`, `apps/web/src/app/globals.css`.

- [ ] **Step 1: Guest server actions**

Create `apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/guests/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../server/caller";

export async function addGuestAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const groupLabel = String(formData.get("groupLabel") ?? "");
  const rsvpStatus = String(formData.get("rsvpStatus") ?? "awaiting") as
    | "awaiting"
    | "coming"
    | "declined"
    | "maybe";
  if (!eventId || !name) return;
  await (await getServerCaller()).guests.create({
    eventId,
    guest: { name, email, groupLabel, rsvpStatus },
  });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/guests`);
}

export async function setGuestRsvpAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const guestId = String(formData.get("guestId") ?? "");
  const rsvpStatus = String(formData.get("rsvpStatus") ?? "awaiting") as
    | "awaiting"
    | "coming"
    | "declined"
    | "maybe";
  if (!eventId || !guestId) return;
  await (await getServerCaller()).guests.update({ eventId, guestId, patch: { rsvpStatus } });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/guests`);
}

export async function removeGuestAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const guestId = String(formData.get("guestId") ?? "");
  if (!eventId || !guestId) return;
  await (await getServerCaller()).guests.remove({ eventId, guestId });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/guests`);
}
```

- [ ] **Step 2: Guests page**

Create `apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/guests/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../server/auth";
import { getServerCaller } from "../../../../../../server/caller";
import { addGuestAction, setGuestRsvpAction, removeGuestAction } from "./actions";

export const dynamic = "force-dynamic";

const RSVP_OPTIONS = [
  { value: "awaiting", label: "Awaiting" },
  { value: "coming", label: "Coming" },
  { value: "declined", label: "Declined" },
  { value: "maybe", label: "Maybe" },
] as const;

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const caller = await getServerCaller();
  const summary = await caller.guests.summary({ eventId });
  const { guests } = await caller.guests.list({ eventId, limit: 100 });

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Guest list</p>
      <h1>Who&apos;s invited</h1>

      <p className="gsummary">
        <strong>{summary.total}</strong> guests · <strong>{summary.coming}</strong> coming ·{" "}
        <strong>{summary.declined}</strong> declined · <strong>{summary.maybe}</strong> maybe ·{" "}
        <strong>{summary.awaiting}</strong> awaiting
      </p>

      <section className="makepanel">
        <h2>Add a guest</h2>
        <form action={addGuestAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Guest name" name="name" placeholder="Full name" required />
          <input aria-label="Guest email" name="email" type="email" placeholder="email (optional)" />
          <input aria-label="Guest group" name="groupLabel" placeholder="group (optional)" />
          <select aria-label="Guest RSVP" name="rsvpStatus" defaultValue="awaiting">
            {RSVP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit">Add guest</button>
        </form>
      </section>

      <ul className="guests">
        {guests.map((g) => (
          <li key={g.id} data-guest={g.id} data-rsvp={g.rsvpStatus}>
            <span className="gname">{g.name}</span>
            <span className="gmeta">{g.groupLabel ?? g.email ?? ""}</span>
            <form action={setGuestRsvpAction} className="ginline">
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="orgId" value={orgId} />
              <input type="hidden" name="guestId" value={g.id} />
              <select aria-label={`RSVP for ${g.name}`} name="rsvpStatus" defaultValue={g.rsvpStatus}>
                {RSVP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="ghost">
                Save
              </button>
            </form>
            <form action={removeGuestAction} className="ginline">
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="orgId" value={orgId} />
              <input type="hidden" name="guestId" value={g.id} />
              <button type="submit" className="ghost">
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Event toolkit — link built modules, "Coming soon" for the rest (no paywall at launch)**

Replace `apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/page.tsx` with:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../server/auth";
import { getServerCaller } from "../../../../../../server/caller";

export const dynamic = "force-dynamic";

// Modules with a real page today. Everything else shows "Coming soon" (free launch: no paywall).
const BUILT = new Set(["guests"]);

function pretty(module: string): string {
  return module.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const modules = await (await getServerCaller()).events.modules({
    organizationId: orgId,
    eventId,
  });

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}`}>
        ← Events
      </a>
      <p className="eyebrow">Your toolkit</p>
      <h1>Plan this event</h1>
      <p>Everything you need, in one place.</p>
      <ul className="modules">
        {modules.map((m) => {
          const built = BUILT.has(m.module);
          const href = `/dashboard/org/${orgId}/event/${eventId}/${m.module}`;
          return (
            <li key={m.module} data-module={m.module} data-locked={m.locked} data-built={built}>
              {built ? (
                <a className="mname mlink" href={href}>
                  {pretty(m.module)}
                </a>
              ) : (
                <span className="mname">{pretty(m.module)}</span>
              )}
              <span className="mstatus">{built ? "Open →" : "Coming soon"}</span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
```
> The entitlement engine is still consulted (`events.modules` returns `locked`), so when `freeLaunch` is turned off later, this page can render a "locked / upgrade" state from `m.locked` — the data is already here. For launch we present built→Open, unbuilt→Coming soon.

- [ ] **Step 4: Styles**

Append to `apps/web/src/app/globals.css` (before the reduced-motion block):
```css
/* ---- guests ------------------------------------------------------------- */
.gsummary {
  font-size: 1rem;
  color: var(--ink-soft);
  background: var(--paper-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 16px;
  max-width: none;
}
.gsummary strong { color: var(--ink); font-weight: 700; }
.guests {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.guests li {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--line-strong);
  border-radius: 12px;
  padding: 12px 14px;
}
.guests li[data-rsvp="coming"] { border-left-color: var(--sage); }
.guests li[data-rsvp="declined"] { border-left-color: var(--clay); }
.guests .gname { font-weight: 600; }
.guests .gmeta { color: var(--ink-faint); font-size: 0.85rem; }
.guests .ginline { flex-direction: row; gap: 6px; margin: 0 0 0 auto; }
.guests .ginline + .ginline { margin-left: 0; }
.guests .ginline button { padding: 7px 12px; font-size: 0.78rem; }
.modules .mlink { color: var(--ink); }
.modules li[data-built="false"] { opacity: 0.62; }
```

- [ ] **Step 5: Typecheck + build + lint**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/web typecheck; echo "tc=$?"
pnpm lint; echo "lint=$?"
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' \
  NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54421' NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='x' \
  SUPABASE_SECRET_KEY='x' NEXT_PUBLIC_BASE_URL='http://localhost:3100' \
  pnpm --filter @planr/web exec next build 2>&1 | grep -E "guests|event|Compiled|error" | head
```
Expected: tc=0, lint=0; build compiles the `…/guests` route.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app
git commit -m "feat(web): Guests page (summary + add/edit-rsvp/remove); event toolkit links built modules

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Playwright E2E — manage a guest list

**Files:** Create `apps/web/e2e/guests.spec.ts`.

- [ ] **Step 1: Write the E2E**

Create `apps/web/e2e/guests.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("host adds guests, sets RSVP, sees the summary update, removes a guest", async ({ page }) => {
  const email = `host_${Date.now()}@example.com`;

  // Sign up + onboard as individual → land in the event
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planning my own event/i }).click();
  await page.getByLabel("Space name").fill("Our Wedding Space");
  await page.getByLabel("Event type").selectOption("wedding");
  await page.getByLabel("Event name").fill("Our Wedding");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page).toHaveURL(/\/event\/.+/);

  // Open the Guests tool from the toolkit
  await page.getByRole("link", { name: "Guests" }).click();
  await expect(page).toHaveURL(/\/guests$/);
  await expect(page.getByText("0 guests", { exact: false })).toBeVisible();

  // Add a guest, coming
  await page.getByLabel("Guest name").fill("Aunt Mary");
  await page.getByLabel("Guest RSVP").selectOption("coming");
  await page.getByRole("button", { name: "Add guest" }).click();
  await expect(page.getByText("Aunt Mary")).toBeVisible();
  await expect(page.getByText("1 guests", { exact: false })).toBeVisible();
  await expect(page.getByText("1 coming", { exact: false })).toBeVisible();

  // Add a second guest (awaiting), then change them to declined
  await page.getByLabel("Guest name").fill("Uncle Joe");
  await page.getByRole("button", { name: "Add guest" }).click();
  await expect(page.getByText("2 guests", { exact: false })).toBeVisible();
  const joeRow = page.locator("li", { hasText: "Uncle Joe" });
  await joeRow.getByLabel("RSVP for Uncle Joe").selectOption("declined");
  await joeRow.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("1 declined", { exact: false })).toBeVisible();

  // Remove Aunt Mary
  const maryRow = page.locator("li", { hasText: "Aunt Mary" });
  await maryRow.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Aunt Mary")).toHaveCount(0);
  await expect(page.getByText("1 guests", { exact: false })).toBeVisible();
});
```

- [ ] **Step 2: Run the E2E**

Run:
```bash
cd /Users/papii/Planr
lsof -ti:3100 | xargs kill -9 2>/dev/null
PUB=$(supabase status 2>/dev/null | grep -oE 'sb_publishable_[A-Za-z0-9_]+' | head -1)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$PUB" pnpm --filter @planr/web run e2e 2>&1 | tail -14
```
Expected: 4 tests pass (onboarding ×2 + collaboration + guests).

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
Expected: typecheck 4/4, lint=0, offline green, db-int green, web-int green.

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/guests.spec.ts
git commit -m "test(web): Playwright E2E — add guests, set RSVP, live summary, remove

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review (against the spec)

**Spec coverage:**
- §3 SSoT / layered slice → Tasks 3-7 (port → service → adapter → tRPC → page); Prisma boundary unchanged.
- §4 shared spine + `Guest` model (enum, indexes, cascade, denormalised org) → Task 2.
- §5 screenflow (toolkit → Guests; add/edit-rsvp/remove; summary) → Task 7; E2E Task 8.
- §6 free-now/lockable gate (single flag, wired) → Task 4 (`FREE_LAUNCH` + `assertModuleAvailable`) + Task 7 toolkit; locked-path unit-tested (Task 4).
- §7 data flow (read via caller, write via actions, layered authz) → Tasks 4,6,7.
- §8 enterprise A–I: A integrity (Task 2 enum/FK/index) · B scale (keyset pagination + aggregate summary, Tasks 4-5) · C tenant depth (service authz + repo `(org,event)` scoping incl. update/remove via *Many, Tasks 4-5) · D one Zod contract (Task 3 `guestInput`, reused by tRPC Task 6) · E typed errors→codes (Task 1) · F additive named API (Task 6) · G seams (stable `Guest.id`, normalised) · H test depth (unit + integration + adversarial cross-tenant + E2E) · I forward-only migration (Task 2).
- §9 API contract → Task 6 procedures match exactly. §10 naming → followed throughout.

**Placeholder scan:** none — every step has complete code/commands.

**Type consistency:** `GuestRecord`/`GuestWrite`/`GuestSummary`/`GuestRepository` defined once (Task 3) and used by fakes (Task 3), service (Task 4), adapter (Task 5), router (Task 6). `guestInput`/`toGuestWrite`/`toGuestPatch` defined in Task 3, consumed by the service (Task 4) and router (Task 6). `RsvpStatus` values (`awaiting|coming|declined|maybe`) identical across types, enum (Task 2), DTO (Task 3), service tests, UI options (Task 7), and E2E (Task 8). `EventRepository.getById(id)` added in the port (Task 3), fake (Task 3), and adapter (Task 5), used by the service (Task 4). `makeGuestService(repos, { freeLaunch? })` signature matches between service (Task 4), its tests (Task 4), the container (Task 6, default flag), and the int-test container (Task 6). tRPC `guests.*` procedure names/inputs match the server actions (Task 7) and E2E accessible names (Task 8: "Guest name", "Guest RSVP", "RSVP for <name>", "Add guest", "Save", "Remove").
