---
title: Planr Budget — Design Spec (third feature; copies the slice template)
date: 2026-06-05
status: approved
type: design-spec
tags: [planr, feature, budget, money, enterprise, single-source-of-truth, multi-tenant]
owner: atunbi
relates: [2026-06-05-planr-guest-list-design.md, 2026-06-05-planr-tasks-checklist-design.md]
---

# Planr Budget — Design Spec

> Third real feature, again a near-exact copy of the slice template (port → adapter → service → router
> → page, same gate, same test ladder). The new wrinkle is **money** — handled as integer minor units to
> avoid float error. Held to the same enterprise standard; no gold-plating.

## 1. Goal & context

Let a host track an event's budget — add line items (label, optional category, estimated cost, amount
paid), and see a live summary ("£18,400 budgeted · £7,250 paid · £11,150 to go"). Works for any event type.

- **Free at launch, lockable later.** Ships as the entitlement-gated `"budget"` module (free-baseline today,
  so free now; the same gate locks it if it leaves the baseline later). Zero feature rewrite.
- **Single source of truth.** `@planr/db` (Prisma + Postgres) is the only data authority; only a repository
  touches the DB (lint-enforced). Reuses every primitive guests/tasks established — typed errors, the tRPC
  error-mapping middleware, the module gate, `Event.getById`, the integration harness, the Keepsake system.

## 2. Decisions (locked)

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Money representation | **Integer minor units** (`estimatedCents`, `paidCents`) | Floats lose pennies; integers are exact and aggregate cleanly |
| 2 | Currency | **Single, GBP `£`** for v1; no `currency` column | UK context; per-org/multi-currency is a clean future slice — YAGNI now |
| 3 | Per-item fields | label (1–160, req), category? (≤80, freeform), estimatedCents (≥0), paidCents (≥0, default 0), notes? | The minimum that supports a real "budgeted vs paid" view |
| 4 | Categories | **Freeform string now**; grouped totals & per-category caps deferred | Line-items-first; grouping is a fast follow, not a v1 blocker |
| 5 | Summary | `{ itemCount, totalEstimated, totalPaid, remaining }` (cents); `remaining` may be **negative** to surface overspend | Same summary-driven shape as guests/tasks |
| 6 | Ordering | **id-keyset pagination** (like guests) | No natural deadline ordering; keep the simple cursor |
| 7 | Shape | Self-contained vertical slice copying the guests/tasks architecture & naming | Prove the template repeats a third time |

## 3. Architecture & the single source of truth

Identical hexagonal flow; every arrow already exists.

```
apps/web (page + server actions) ── tRPC (budget router) ──► @planr/core BudgetService
   ── module gate (resolveModuleAccess, "budget") + authz ── BudgetItemRepository port + budgetItemInput DTO
        ▼
@planr/db  PrismaBudgetItemRepository ──► Postgres (BudgetItem table)  ◄── ONLY data authority
```

## 4. Data model (the one authority)

`BudgetItem` (mirrors Guest; tenant-scoped, indexed, cascade with event/org):

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organizationId | uuid FK→Organization (cascade) | tenant scope |
| eventId | uuid FK→Event (cascade) | owning event |
| label | text | 1–160 chars (DTO) |
| category | text? | ≤80 chars, freeform |
| estimatedCents | integer | ≥0 (DTO); planned amount in pence |
| paidCents | integer default 0 | ≥0 (DTO); amount paid so far in pence |
| notes | text? | ≤2000 |
| createdAt | timestamptz default now() | |
| updatedAt | timestamptz @updatedAt | |

Indexes: `[eventId]`, `[organizationId, eventId]`. One hand-written migration (same approach as guests/tasks).
No enum.

## 5. Domain contracts (ports & DTO)

```ts
interface BudgetItemRecord {
  id: string; organizationId: string; eventId: string;
  label: string; category: string | null; estimatedCents: number; paidCents: number; notes: string | null;
}
interface BudgetSummary { itemCount: number; totalEstimatedCents: number; totalPaidCents: number; remainingCents: number }
interface BudgetItemWrite { label: string; category: string | null; estimatedCents: number; paidCents: number; notes: string | null }

interface BudgetItemRepository {
  create(input: { organizationId: string; eventId: string } & BudgetItemWrite): Promise<BudgetItemRecord>;
  listByEvent(input: { organizationId: string; eventId: string; limit: number; cursor?: string }):
    Promise<{ items: BudgetItemRecord[]; nextCursor: string | null }>;
  getById(input: { organizationId: string; eventId: string; id: string }): Promise<BudgetItemRecord | null>;
  update(input: { organizationId: string; eventId: string; id: string; patch: Partial<BudgetItemWrite> }):
    Promise<BudgetItemRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  summaryByEvent(input: { organizationId: string; eventId: string }): Promise<BudgetSummary>;
}
```

`budgetItemInput` (Zod): `label` 1–160 (trimmed); `category` blank→null (≤80); `estimated`/`paid` accepted as
**major-unit numbers** (e.g. `1500.5`) and converted to integer cents via `Math.round(x * 100)`, rejecting
negatives/NaN/non-finite; `notes` blank→null. `toBudgetItemWrite`/`toBudgetItemPatch` mirror the guest helpers,
and like tasks the transforms **preserve `undefined`** so partial patches never zero an unprovided amount.

> **The cents conversion is the one bug-prone spot.** It lives only in the DTO, is unit-tested for rounding
> (`19.99 → 1999`, `0.1+0.2` style inputs), negative rejection, and blank/absent handling.

## 6. Service & API

`makeBudgetService(repos, opts?)` — structural copy of `makeTaskService`: `gateRead`/`gateWrite`
(`"budget"` module, `content:edit` to write), `summary`/`list` (limit clamp 1–100, default 50)/`create`/
`update` (404)/`remove` (404). tRPC `budget` router: `summary`/`list`/`create`/`update`/`remove`, boundary Zod
schema declared in the router (web's `z`; amounts as numbers), service re-validates with `budgetItemInput`.
Errors map to `NOT_FOUND`/`FORBIDDEN` via the existing middleware.

## 7. UI (Keepsake) & toolkit linking

New `…/event/[eventId]/budget/page.tsx` + `actions.ts` (add / set-paid / set-estimated / remove). Live summary
bar in `£`. Rows show label, category chip, `£paid / £estimated`, and a `data-overpaid` flag (paid > estimated)
styled in clay. A small money formatter (`formatGBP(cents)`) in the page. Toolkit `BUILT` set gains `"budget"`.
Reuse CSS tokens; add a `.budget` block analogous to `.tasks`.

## 8. Testing ladder (all must pass)

1. **DTO unit** — label bounds; cents rounding (`19.99→1999`, `1500→150000`); negative/NaN rejected; blank
   category/notes → null; absent amount not zeroed in a patch.
2. **Service unit** (fakes) — CRUD, summary (incl. negative `remaining` on overspend), limit clamp, cursor
   paging, cross-tenant denial, viewer-read-not-write, gate wired when `freeLaunch` off.
3. **Adapter integration** (real Postgres) — tenant-scoped CRUD, id-keyset pagination no repeats/skips,
   `SUM` summary totals incl. overspend, `Event.getById` reuse.
4. **Router integration** — full CRUD via `createCaller`; `FORBIDDEN` non-member, `NOT_FOUND` unknown event.
5. **Playwright E2E** — add items, record a payment, see the summary update, overspend surfaced, remove an item.
   Plus the existing 5 specs stay green.

## 9. Naming scheme

`BudgetItem` (model/record) · `budget` (module key, router namespace, route segment) · `budgetItemInput`/
`toBudgetItemWrite`/`toBudgetItemPatch` · `BudgetItemRepository`/`PrismaBudgetItemRepository` ·
`makeBudgetService`/`BudgetService` · `addBudgetItemAction`/`setBudgetItemPaidAction`/`setBudgetItemEstimatedAction`/
`removeBudgetItemAction`.

## 10. Non-goals (deferred)

Multi-currency / per-org currency · category grouping & per-category caps · payment schedules & due dates ·
vendor linkage (ties to the future Vendors module) · receipts/attachments · CSV export. Each is a clean later slice.

## 11. Success criteria

- Every test rung green; full monorepo gate (typecheck 4/4, lint 0, unit, db-int, web-int, e2e) green.
- A host manages an event budget end-to-end in the browser, money exact to the penny, overspend surfaced live.
- A faithful third copy of the template — confirming the pattern is now routine — with money the only new concern,
  isolated to the DTO and proven by tests.
