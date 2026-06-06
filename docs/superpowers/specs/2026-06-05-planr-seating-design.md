---
title: Planr Seating — Design Spec (fourth feature; the first cross-module slice)
date: 2026-06-05
status: approved
type: design-spec
tags: [planr, feature, seating, cross-module, enterprise, single-source-of-truth, multi-tenant]
owner: atunbi
relates: [2026-06-05-planr-guest-list-design.md, 2026-06-05-planr-budget-design.md]
---

# Planr Seating — Design Spec

> Fourth feature, and the first that **depends on another module**: you seat *guests* at *tables*. The
> template still holds (port → adapter → service → router → page, same gate, same test ladder); the new
> concern is a clean cross-module boundary. Held to the same enterprise standard; no gold-plating.

## 1. Goal & context

Let a host build a seating plan — create tables with a capacity, assign guests to them, and see who's
still unseated, with over-capacity tables surfaced. Lives behind the `"seating"` module.

- **Free at launch, lockable later.** `"seating"` is **not** a free-baseline module (it's a typical
  paid/advanced one in the registry). So today, with `FREE_LAUNCH` on, the gate short-circuits and it's
  free; when launch ends, the *same* gate locks it from `resolveModuleAccess` with **no rewrite** — and
  this is the first slice whose lock path is real (unlike guests/tasks/budget which are free-baseline).
- **Single source of truth.** Only repositories touch the DB. Seating owns its own tables + assignments;
  it **reads** guests through the existing `GuestRepository` — it never imports another module's tables.

## 2. Decisions (locked)

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Assignment storage | A `SeatAssignment` join (eventId, tableId, guestId) with **`@@unique([guestId])`** | A guest sits at exactly one table; keeps the `Guest` model untouched (decoupled) |
| 2 | Cross-module link | Seating **reads** guests via `repos.guests`; never modifies them | Composition over coupling; guests stays the owner of guest data |
| 3 | Cascades | `SeatAssignment.guestId → Guest` (cascade) and `→ SeatingTable` (cascade) | Deleting a guest or a table frees the seat automatically — no orphans |
| 4 | Over-capacity | **Allowed and surfaced** (clay styling + `overCapacity` flag), not blocked | Consistent with overdue/overspend; avoids brittle shrink-rejection |
| 5 | Re-assign | Assigning an already-seated guest **moves** them (upsert by guestId) | The natural mental model; no "unassign first" dance |
| 6 | View model | Service assembles `{ tables:[{…,guests:[]}], unassigned:[], summary }` in one call | The page needs the whole chart at once; one round-trip |
| 7 | Scale | Load the whole plan (tables + assignments + guests, guests capped at 1000) | A seating chart is inherently a whole-view; pagination is meaningless here |
| 8 | Access | Entitlement-gated `"seating"` (real lock path); free now via the flag | First slice exercising a non-free-baseline gate |

## 3. Architecture & the single source of truth

```
apps/web (seating page + server actions) ── tRPC (seating router) ──► @planr/core SeatingService
   ── gate ("seating") + authz ── reads GuestRepository (names) + SeatingRepository (tables/assignments)
        ▼
@planr/db  PrismaSeatingRepository ──► Postgres (SeatingTable, SeatAssignment)  ◄── ONLY data authority
```

The `SeatingService` is the one place the two modules meet: it composes guest reads with seating writes
to build the plan and to validate that an assigned guest actually belongs to the event.

## 4. Data model (the one authority)

`SeatingTable` (tenant-scoped, cascade with event/org):

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organizationId | uuid FK→Organization (cascade) | tenant scope |
| eventId | uuid FK→Event (cascade) | owning event |
| label | text | 1–80 (DTO) |
| capacity | integer | 1–64 (DTO) |
| createdAt / updatedAt | timestamptz | |

Indexes: `[eventId]`, `[organizationId, eventId]`.

`SeatAssignment` (the join; tenant-scoped):

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organizationId | uuid FK→Organization (cascade) | tenant scope |
| eventId | uuid FK→Event (cascade) | owning event |
| tableId | uuid FK→SeatingTable (cascade) | the table |
| guestId | uuid FK→Guest (cascade) | the seated guest |
| createdAt | timestamptz | |

Constraints: **`@@unique([guestId])`** (one seat per guest). Indexes: `[eventId]`, `[tableId]`.
Two hand-written migrations folded into one file (same approach as prior slices). No enum.

## 5. Domain contracts (ports)

```ts
interface SeatingTableRecord { id: string; organizationId: string; eventId: string; label: string; capacity: number }
interface SeatAssignmentRecord { id: string; tableId: string; guestId: string }
interface SeatingSummary { tableCount: number; totalCapacity: number; assignedCount: number; unassignedCount: number; overCapacityTables: number }

interface SeatingRepository {
  createTable(input: { organizationId: string; eventId: string; label: string; capacity: number }): Promise<SeatingTableRecord>;
  listTables(input: { organizationId: string; eventId: string }): Promise<SeatingTableRecord[]>;
  getTable(input: { organizationId: string; eventId: string; id: string }): Promise<SeatingTableRecord | null>;
  updateTable(input: { organizationId: string; eventId: string; id: string; patch: Partial<{ label: string; capacity: number }> }): Promise<SeatingTableRecord | null>;
  removeTable(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  listAssignments(input: { organizationId: string; eventId: string }): Promise<SeatAssignmentRecord[]>;
  countByTable(input: { organizationId: string; eventId: string; tableId: string }): Promise<number>;
  assign(input: { organizationId: string; eventId: string; tableId: string; guestId: string }): Promise<SeatAssignmentRecord>; // upsert by guestId
  unassign(input: { organizationId: string; eventId: string; guestId: string }): Promise<boolean>;
}
```

`seatingTableInput` (Zod): `label` 1–80 (trimmed), `capacity` integer 1–64. (Amounts/dates absent — the
only new validation is the capacity bound.)

## 6. Service behaviour (the cross-module seam)

`makeSeatingService(repos, opts?)` — gate `"seating"`, `gateRead`/`gateWrite` as before. Methods:

- **`plan(userId, {eventId})`** → assembles the whole chart: `listTables` + `listAssignments` +
  `guests.listByEvent({limit:1000})`, then groups guests under their table and collects the rest as
  `unassigned`; computes `summary` (incl. `overCapacityTables` = tables whose assigned count > capacity).
- `createTable` / `updateTable` (404) / `removeTable` (404).
- **`assign(userId, {eventId, tableId, guestId})`** — verifies the table exists in the event and the
  guest belongs to the event (via `guests.getById`), then upserts the assignment (moving the guest if
  already seated). Over-capacity is **allowed** (surfaced in the plan), not rejected.
- **`unassign(userId, {eventId, guestId})`** (404 if not seated).

> Validating the guest via `repos.guests.getById` is the one cross-module read on the write path; it
> guarantees you can't seat a guest from another event/tenant.

## 7. API & UI

tRPC `seating` router: `plan`/`createTable`/`updateTable`/`removeTable`/`assign`/`unassign`. New
`…/event/[eventId]/seating/page.tsx` + `actions.ts`. The page shows a summary bar, an "Add a table" form,
a card per table (label, `assigned/capacity`, `data-over-capacity` flag in clay, its seated guests each
with an "Unseat" button), and an **"Unseated guests"** pool where each guest has a "seat at…" `<select>`
of tables. Toolkit `BUILT` set gains `"seating"`; a `styles/seating.css` partial is added and `@import`ed.

## 8. Testing ladder (all must pass)

1. **DTO unit** — label bounds; capacity integer 1–64; rejects 0, 65, non-integers.
2. **Service unit** (fakes) — create tables; assign/move/unassign; `plan` groups guests + lists unseated;
   summary incl. `overCapacityTables`; over-capacity allowed; assigning a cross-event/cross-tenant guest
   rejected; cross-tenant denial; viewer-read-not-write; gate wired when `freeLaunch` off.
3. **Adapter integration** (real Postgres) — table CRUD; `@@unique(guestId)` upsert moves a guest;
   unassign; cascade (deleting a table frees its guests; deleting a guest frees the seat); `countByTable`.
4. **Router integration** — full flow via `createCaller`; `FORBIDDEN` non-member, `NOT_FOUND` unknown table.
5. **Playwright E2E** — add two tables, seat guests, move a guest between tables, overfill a table → over-
   capacity surfaced, unseat a guest. Plus the existing 6 specs stay green.

## 9. Naming scheme

`SeatingTable` / `SeatAssignment` (models) · `seating` (module key, router, route) · `seatingTableInput`/
`toSeatingTableWrite`/`toSeatingTablePatch` · `SeatingRepository`/`PrismaSeatingRepository` ·
`makeSeatingService`/`SeatingService` · `addTableAction`/`setTableAction`/`removeTableAction`/
`assignGuestAction`/`unassignGuestAction`.

## 10. Non-goals (deferred)

Drag-and-drop UI · seat numbers / specific seats within a table · table shapes & spatial canvas layout ·
auto-seating / constraints (keep families together, separate exes) · per-table notes · printable charts.
Each is a clean future slice on top of this data model.

## 11. Success criteria

- Every test rung green; full monorepo gate green.
- A host builds a seating plan end-to-end in the browser; unseated guests and over-capacity tables surfaced.
- Seating is self-contained — it reads guests but owns its own tables/assignments and never mutates the
  Guest model — proving the template extends cleanly to **cross-module** features.
- This is the first slice whose `freeLaunch`-off lock path is real (non-free-baseline), exercised by a test.
