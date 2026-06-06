---
title: Planr RSVP — Design Spec (fifth feature; first public/unauthenticated surface)
date: 2026-06-05
status: approved
type: design-spec
tags: [planr, feature, rsvp, public, token-auth, enterprise, multi-tenant]
owner: atunbi
relates: [2026-06-05-planr-guest-list-design.md, 2026-06-05-planr-seating-design.md]
---

# Planr RSVP — Design Spec

> Fifth feature, and the first with a **public, unauthenticated** surface: a guest opens a link with no
> login and sets their own attendance. The template still holds for the host side; the new concern is a
> safe **token-scoped** access model that lives alongside (never weakens) the authed gate.

## 1. Goal & context

- **Guest (public):** opens `/rsvp/<token>`, sees the event name and their own name, picks
  Coming / Declined / Maybe, optionally flags a plus-one, submits, sees a confirmation. No account.
- **Host (authed):** a gated `"rsvp"` page showing the response summary and each guest's shareable link.

RSVP writes to the **existing** `Guest.rsvpStatus`/`plusOne` — it is the self-service flip side of the
guest list the host already manages, not a new data island.

## 2. Decisions (locked)

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Public auth | **Possession of an unguessable per-guest token** (uuid), no login | The whole point is a frictionless guest link |
| 2 | Token storage | `Guest.rsvpToken` (unique), backfilled for existing rows | One token per guest; lives with the guest it authorises |
| 3 | Two services | `PublicRsvpService` (ungated, token-only) + authed `RsvpService` (gated `"rsvp"`) | Public path must never touch authz/membership; host path is a normal gated view |
| 4 | Public scope | Reads only {eventName, guestName, rsvpStatus, plusOne}; writes only rsvpStatus + plusOne of that one guest | No data leakage, no privilege beyond one's own row |
| 5 | Invalid token | `NotFoundError` → 404 (no "exists/doesn't" oracle beyond that) | Don't leak which tokens are real beyond a generic 404 |
| 6 | Module gate | Only the **host** page is gated `"rsvp"`; public RSVP is always allowed | A guest can't know about plans; their RSVP is their own data |
| 7 | Abuse | uuid (122-bit) defeats enumeration; per-IP rate-limiting is **deferred infra** | YAGNI at the app layer for v1; noted, not built |

## 3. Architecture

```
PUBLIC:  /rsvp/[token] (no auth) ── tRPC publicProcedure rsvp.get/respond ──► PublicRsvpService
            └ findByRsvpToken + events.getById (name) + setRsvpByToken — NO authz, NO gate
HOST:    /event/[id]/rsvp (authed) ── tRPC authedProcedure rsvp.overview ──► RsvpService (gate "rsvp")
            └ reuses guests.summaryByEvent + guests.listByEvent (tokens → links)
```

`publicProcedure` already tolerates a null user (it's how `me` works), so the public page uses the normal
server caller — no bespoke unauthenticated client. The safety comes from the service only ever resolving
a guest **by token** and returning a minimal DTO.

## 4. Data model

Extend `Guest` with one column — no new table:

| Column | Type | Notes |
|--------|------|-------|
| rsvpToken | text, **unique**, app-default uuid | the public capability; backfilled for existing rows |

Migration: `ADD COLUMN rsvpToken TEXT` → `UPDATE … SET gen_random_uuid()::text` (backfill) →
`SET NOT NULL` → unique index. Prisma model: `rsvpToken String @unique @default(uuid())` (app supplies
it for new guests; no DB default, matching the other models).

## 5. Domain contracts

`GuestRecord` gains `rsvpToken: string`. `GuestRepository` gains:

```ts
findByRsvpToken(token: string): Promise<GuestRecord | null>;
setRsvpByToken(input: { token: string; rsvpStatus: RsvpStatus; plusOne?: boolean }): Promise<GuestRecord | null>;
```

`rsvpResponseInput` (Zod): `rsvpStatus` ∈ {coming, declined, maybe} (note: **not** "awaiting" — a guest
can't un-respond), `plusOne` boolean optional.

> A guest may only set a *real* response (coming/declined/maybe); "awaiting" stays a host-only/initial state.

## 6. Services

```ts
// Public — NO userId, NO gate. Token is the capability.
makePublicRsvpService(repos): {
  get(token): Promise<{ eventName: string; guestName: string; rsvpStatus: RsvpStatus; plusOne: boolean }>;     // 404 on bad token
  respond(token, input): Promise<{ …same shape… }>;                                                            // 404 on bad token
}
// Host — authed, gated "rsvp".
makeRsvpService(repos, opts?): {
  overview(userId, { eventId }): Promise<{ summary: GuestSummary; guests: { id; name; rsvpStatus; token }[] }>;
}
```

`PublicRsvpService.get` resolves the guest by token, then `events.getById(guest.eventId)` for the name; it
returns the minimal DTO only. `respond` validates with `rsvpResponseInput` and calls `setRsvpByToken`.

## 7. API & UI

- tRPC `rsvp` router: `get` (**publicProcedure**), `respond` (**publicProcedure**), `overview` (authedProcedure).
- **Public page** `app/rsvp/[token]/page.tsx` + `actions.ts` — standalone (its own minimal Keepsake shell,
  no dashboard chrome, no auth redirect). Shows event + guest name, a 3-way status form + plus-one toggle,
  and a confirmation state. Bad token → a friendly "this link isn't valid" 404 view.
- **Host page** `app/dashboard/org/[orgId]/event/[eventId]/rsvp/page.tsx` — summary bar + a row per guest
  with status and a read-only, copyable RSVP link (`/rsvp/<token>`). Toolkit `BUILT` += `"rsvp"`; a
  `styles/rsvp.css` partial is added and `@import`ed.

## 8. Testing ladder

1. **DTO unit** — accepts coming/declined/maybe + optional plusOne; rejects "awaiting" and unknown values.
2. **Service unit** (fakes) — public get/respond by token (happy + 404 on bad token); respond changes only
   that guest; the public DTO carries no extra fields; host overview returns summary + links; host gate
   wired when `freeLaunch` off; host cross-tenant denial.
3. **Adapter integration** (real Postgres) — `findByRsvpToken`, `setRsvpByToken`, token uniqueness, token
   present on created guests.
4. **Router integration** — public `get`/`respond` work with a **null user** (unauthenticated); a bad token
   → `NOT_FOUND`; host `overview` is `FORBIDDEN` for a non-member.
5. **Playwright E2E** — host opens the RSVP page and reads a guest's link; visiting that link
   unauthenticated, the guest sets "Coming" + plus-one; the host page then reflects the response. Existing
   7 specs stay green.

## 9. Naming scheme

`rsvpToken` (guest column) · `rsvp` (module key, router, host route) · `rsvpResponseInput` ·
`findByRsvpToken`/`setRsvpByToken` (guest repo) · `makePublicRsvpService`/`PublicRsvpService` ·
`makeRsvpService`/`RsvpService` · `respondAction` (public) · route `/rsvp/[token]`.

## 10. Non-goals (deferred)

Email/SMS delivery of links · per-IP rate-limiting & captcha · token rotation/expiry · dietary/message
fields · "+N" plus-one counts (v1 is a boolean) · reminder nudges · public event branding. Each is a clean
later slice.

## 11. Success criteria

- Every test rung green; full monorepo gate green.
- A guest RSVPs end-to-end with no account via their link; the host sees it.
- The public surface leaks nothing beyond {eventName, guestName, own status} and can only mutate one guest's
  RSVP — proven by tests — while the authed gate is untouched for the host side.
