---
title: Planr Tasks / Checklist — Design Spec (second feature; copies the slice template)
date: 2026-06-05
status: approved
type: design-spec
tags: [planr, feature, tasks, checklist, enterprise, single-source-of-truth, multi-tenant]
owner: atunbi
relates: [2026-06-05-planr-guest-list-design.md, 2026-06-04-planr-foundation-design.md]
---

# Planr Tasks / Checklist — Design Spec

> The second real feature, deliberately built as a **near-exact copy of the Guest List slice** so the
> pattern proves repeatable. Same layering, same gate, same test ladder. Where it differs from guests,
> the difference is called out explicitly. Held to the same enterprise standard — sound, scalable,
> secure, shaped for change, no gold-plating.

## 1. Goal & context

Let a host plan an event's to-dos — add/edit/remove checklist items, mark them done, give them a due
date, and see a live summary ("18 tasks · 11 done · 7 to go · 2 overdue"). It is the second genuinely
useful, **free** tool and must work for **any** event type (wedding, baby shower, funeral, party…).

- **Free at launch, lockable later.** Ships as a normal entitlement-gated module (`"tasks"`); the gate
  is wired in but open. `tasks` is a free-baseline module today, so it stays free — and the *same* gate
  locks it later if it is dropped from the baseline. Zero feature rewrite. (See `project-planr-free-launch`.)
- **Single source of truth.** `@planr/db` (Prisma + Postgres) is the only data authority; nothing
  touches the DB except a repository — enforced by the existing lint boundary.
- **Reuses everything the Guest List established.** Typed domain errors (`NotFoundError`/`ForbiddenError`),
  the tRPC error-mapping middleware, the module gate (`makeGuestService`'s pattern), `Event.getById`,
  the integration-test harness, and the Keepsake design system. No new infrastructure — only a new slice.

## 2. Decisions (locked)

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Per-task fields | **Lean**: title (required, 1–200), notes?, `done` (bool), `dueDate?` | A checklist item is binary; richer state is YAGNI until proven |
| 2 | Status model | **`done` boolean**, not a `todo/doing/done` enum | Binary matches a checklist; a board/kanban is a deferred future feature |
| 3 | Assignee | **Not in v1** | Assignment UI must earn its keep; collaboration already shares the whole workspace |
| 4 | `overdue` | **Derived, never stored** (`dueDate < now && !done`) | No clock-drift / no stale column; computed in the summary query and the row UI |
| 5 | Access | **Entitlement-gated** (`"tasks"` module); free now via the reversible flag | Identical to guests |
| 6 | Ordering | **By `dueDate` (nulls last) then `createdAt`**, keyset-paginated by a stable composite cursor | A checklist reads best by deadline; see §6 for the cursor |
| 7 | Shape | A self-contained vertical slice copying the guests architecture & naming | Prove the template repeats |

## 3. Architecture & the single source of truth

Identical hexagonal flow to the Guest List — every arrow already exists for guests:

```
apps/web (page + server actions)
        │  tRPC  (tasks router)
        ▼
@planr/core  TaskService ── module gate (resolveModuleAccess, "tasks") ── authz (membership/permission)
        │  TaskRepository port + taskInput DTO (Zod)
        ▼
@planr/db   PrismaTaskRepository  ──►  Postgres (Task table)   ◄── ONLY data authority
```

- **`@planr/core`** owns the domain: the `Task` types, the `TaskRepository` **port**, the `taskInput`
  validation DTO, and the framework-free `TaskService` (gate + authz + business rules). No Prisma, no tRPC.
- **`@planr/db`** owns persistence: the `Task` Prisma model + migration and the `PrismaTaskRepository`
  **adapter** (the only place that imports `@prisma/client`). Registered in `createRepositories`.
- **`apps/web`** owns delivery: the tRPC `tasks` router (boundary Zod schema + maps domain errors to
  tRPC codes via the existing middleware) and the Keepsake Tasks page with server actions.

## 4. Data model (the one authority)

`Task` table (mirrors `Guest`; tenant-scoped, indexed, cascade-deleted with its event/org):

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organizationId | uuid FK→Organization (cascade) | tenant scope |
| eventId | uuid FK→Event (cascade) | owning event |
| title | text | 1–200 chars (enforced in DTO) |
| notes | text? | ≤2000 chars |
| done | boolean default false | the checklist state |
| dueDate | timestamptz? | optional deadline |
| createdAt | timestamptz default now() | |
| updatedAt | timestamptz @updatedAt | |

Indexes: `[eventId]`, `[organizationId, eventId]`, `[eventId, done]`, `[eventId, dueDate]`
(the last two back the summary and the due-date ordering).

No new enum (unlike guests' `RsvpStatus`). One new migration, hand-written SQL (same approach as the
Guest migration — `prisma migrate dev` is non-interactive-hostile in this environment).

## 5. Domain contracts (ports & DTO)

```ts
// @planr/core ports
interface TaskRecord {
  id: string; organizationId: string; eventId: string;
  title: string; notes: string | null; done: boolean; dueDate: Date | null;
}
interface TaskSummary { total: number; done: number; remaining: number; overdue: number }
interface TaskWrite { title: string; notes: string | null; done: boolean; dueDate: Date | null }

interface TaskRepository {
  create(input: { organizationId: string; eventId: string } & TaskWrite): Promise<TaskRecord>;
  listByEvent(input: { organizationId: string; eventId: string; limit: number; cursor?: string }):
    Promise<{ tasks: TaskRecord[]; nextCursor: string | null }>;
  getById(input: { organizationId: string; eventId: string; id: string }): Promise<TaskRecord | null>;
  update(input: { organizationId: string; eventId: string; id: string; patch: Partial<TaskWrite> }):
    Promise<TaskRecord | null>;
  remove(input: { organizationId: string; eventId: string; id: string }): Promise<boolean>;
  summaryByEvent(input: { organizationId: string; eventId: string; now: Date }): Promise<TaskSummary>;
}
```

`taskInput` (Zod): `title` 1–200 (trimmed), `notes` blank→null, `done` optional bool,
`dueDate` optional ISO-8601 string preprocessed to a `Date` (blank→null). `toTaskWrite`/`toTaskPatch`
mirror the guest DTO helpers exactly.

> **`now` is injected** into `summaryByEvent` (not read inside the adapter) so the overdue boundary is
> deterministic and testable — the service passes `new Date()`; tests pass a fixed instant.

## 6. Ordering & pagination (the one real divergence from guests)

Guests paginate by `id` keyset. A checklist reads best **by deadline**, so Tasks order by
`(dueDate ASC NULLS LAST, createdAt ASC, id ASC)` with a **composite keyset cursor** encoding the last
row's `(dueDate, createdAt, id)`. The cursor is an opaque base64 string; the adapter decodes it into the
`OR`-of-tuples `WHERE` clause. Fetch `limit + 1` to detect a further page (same trick as guests).

> v1 page requests `limit: 100`, so most events never paginate — but the keyset is correct and indexed
> from day one (`[eventId, dueDate]`), so a 2,000-task corporate event scrolls without `OFFSET` decay.
> If the composite cursor proves fiddly under test, the locked fallback is **id-keyset + in-memory
> deadline sort within the page** (documented in the plan), never `OFFSET`.

## 7. Service behaviour (gate + authz + rules)

`makeTaskService(repos, opts?: { freeLaunch?: boolean })` — a structural copy of `makeGuestService`:

- `gateRead` → resolve event via `events.getById`, `authz.requireMembership`, `assertModuleAvailable("tasks")`.
- `gateWrite` → same but `authz.requirePermission(..., "content:edit")`.
- `assertModuleAvailable` short-circuits when `freeLaunch`; otherwise consults `resolveModuleAccess`.
- Methods: `summary` (injects `now`), `list` (clamps limit 1–100, default 50), `create`, `update`
  (404 if absent), `remove` (404 if absent) — all tenant-scoped, all re-validating with `taskInput`.

A `toggleDone` convenience is **not** added; toggling is `update({ patch: { done } })` from the UI.

## 8. API surface (tRPC `tasks` router)

`summary({ eventId })`, `list({ eventId, limit?, cursor? })`, `create({ eventId, task })`,
`update({ eventId, taskId, patch })`, `remove({ eventId, taskId })`. Boundary Zod schema declared in the
router (web's own `z`, per the cross-package-zod lesson from guests); the service stays the authoritative
validator. Domain errors map to `NOT_FOUND`/`FORBIDDEN` automatically via the existing middleware.

## 9. UI (Keepsake) & toolkit linking

- New page `…/event/[eventId]/tasks/page.tsx` + `actions.ts` (add / toggle-done / set-due / remove),
  mirroring the guests page. Live summary bar; rows show a checkbox (done), title, due date, and an
  `data-overdue` flag styling overdue rows in clay.
- The event toolkit's `BUILT` set gains `"tasks"`, so its tile becomes an active "Open →" link
  alongside Guests; everything else stays "Coming soon".
- Reuse existing CSS tokens; add a small `.tasks` block analogous to `.guests`.

## 10. Testing ladder (same rungs as guests; all must pass)

1. **DTO unit** — title bounds, blank→null, dueDate parse/blank, bad date rejected.
2. **Service unit** (fakes) — CRUD, summary incl. **overdue with an injected `now`**, limit clamp,
   cursor paging, cross-tenant denial, viewer-can-read-not-write, gate wired when `freeLaunch` off.
3. **Adapter integration** (real Supabase Postgres) — tenant-scoped CRUD, composite-keyset pagination
   with no row repeats/skips across pages, summary counts incl. overdue, `Event.getById` reuse.
4. **Router integration** — full CRUD via `createCaller`; `FORBIDDEN` for non-members, `NOT_FOUND` for
   unknown event.
5. **Playwright E2E** — add tasks, mark one done, set a due date in the past → overdue reflected in the
   summary, remove a task. Plus the existing 4 specs stay green.

## 11. Naming scheme (consistent with guests)

`Task` (model/record) · `tasks` (module key, table relation, router namespace, route segment) ·
`taskInput`/`toTaskWrite`/`toTaskPatch` (DTO) · `TaskRepository`/`PrismaTaskRepository` ·
`makeTaskService`/`TaskService` · `addTaskAction`/`setTaskDoneAction`/`setTaskDueAction`/`removeTaskAction`.

## 12. Non-goals (explicitly deferred)

Kanban/status board · assignees & notifications · recurring/templated checklists (e.g. a 12-month
wedding timeline) · subtasks · reminders/email · public/shared checklists. Each is a clean future slice;
none is needed to ship a useful v1.

## 13. Success criteria

- Every test rung in §10 green; full monorepo gate (typecheck 4/4, lint 0, unit, db-int, web-int, e2e) green.
- A host can manage an event's checklist end-to-end in the browser, overdue surfaced live.
- The slice is a faithful copy of the guests template — confirming the pattern repeats cheaply — with the
  one principled divergence (deadline ordering) documented and tested.
- Flipping `tasks` out of the free baseline later locks the module through the existing gate, no rewrite.
