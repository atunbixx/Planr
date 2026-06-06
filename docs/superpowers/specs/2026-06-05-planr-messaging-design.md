---
title: Planr Messaging — Design Spec (sixth feature; host announcements on the public surface)
date: 2026-06-05
status: approved
type: design-spec
tags: [planr, feature, messaging, announcements, public, multi-tenant]
owner: atunbi
relates: [2026-06-05-planr-rsvp-design.md, 2026-06-05-planr-guest-list-design.md]
---

# Planr Messaging — Design Spec

> Sixth feature. v1 is deliberately **broadcast announcements**, not threaded chat: the host posts notes
> to an event and every guest sees them on the RSVP link they already have. It reuses the public
> token surface RSVP built, so it adds a useful channel without standing up an inbox.

## 1. Goal & context

- **Host (authed, gated `"messaging"`):** post / edit / delete announcements for an event (title + body).
- **Guest (public, no auth):** sees the announcements on their `/rsvp/<token>` page — "news from your host".

## 2. Decisions (locked)

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Shape | **Broadcast announcements** (one→many), not threads | Threaded chat is a far bigger surface; YAGNI for v1 |
| 2 | Where guests see them | On the **existing** public RSVP page (`/rsvp/<token>`) | Reuses the token surface; no new public entry point or auth |
| 3 | Model | `Announcement` (title, body) — a new tenant-scoped table | Self-contained; doesn't touch guests/events beyond FKs |
| 4 | Two services | host `MessagingService` (gated) + `PublicMessagingService` (token-only) | Same split that kept RSVP safe |
| 5 | Public exposure | `forToken(token)` → only `{ id, title, body, createdAt }[]` for that guest's event | No org/guest/author leakage |
| 6 | Invalid token (public) | Returns `[]` (no error, no oracle) | The RSVP page already handles a bad token; announcements just show nothing |
| 7 | Ordering | Newest first (`createdAt desc, id desc`) | Announcements read newest-first; small volume, no pagination in v1 |

## 3. Architecture

```
HOST:   /event/[id]/messaging (authed) ── tRPC messaging.list/create/update/remove ──► MessagingService (gate "messaging")
PUBLIC: /rsvp/[token] (no auth) ── tRPC messaging.publicForToken ──► PublicMessagingService
            └ guests.findByRsvpToken → announcements.listByEvent — NO authz, minimal fields
```

The public RSVP page (already built) gains one extra call, `messaging.publicForToken(token)`, rendered as a
read-only "Announcements" section beneath the RSVP form. Messaging stays self-contained — it reads guests
only to resolve token→event, exactly as seating reads guests.

## 4. Data model

`Announcement` (tenant-scoped, cascade with event/org):

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organizationId | uuid FK→Organization (cascade) | tenant scope |
| eventId | uuid FK→Event (cascade) | owning event |
| title | text | 1–120 (DTO) |
| body | text | 1–4000 (DTO) |
| createdAt / updatedAt | timestamptz | |

Indexes: `[eventId]`, `[organizationId, eventId]`, `[eventId, createdAt]`. One hand-written migration. No enum.

## 5. Domain contracts

```ts
interface AnnouncementRecord { id; organizationId; eventId; title; body; createdAt: Date }
interface AnnouncementWrite { title: string; body: string }
interface AnnouncementRepository {
  create(input: { organizationId; eventId } & AnnouncementWrite): Promise<AnnouncementRecord>;
  listByEvent(input: { organizationId; eventId }): Promise<AnnouncementRecord[]>;          // newest first
  getById(input: { organizationId; eventId; id }): Promise<AnnouncementRecord | null>;
  update(input: { organizationId; eventId; id; patch: Partial<AnnouncementWrite> }): Promise<AnnouncementRecord | null>;
  remove(input: { organizationId; eventId; id }): Promise<boolean>;
}
```

`announcementInput` (Zod): `title` 1–120 (trimmed), `body` 1–4000 (trimmed); `toAnnouncementWrite` /
`toAnnouncementPatch` mirror the other DTOs (undefined-preserving for partial patches).

## 6. Services

```ts
makeMessagingService(repos, opts?): {        // authed, gated "messaging"
  list(userId, { eventId }): Promise<AnnouncementRecord[]>;
  create(userId, { eventId, announcement }): Promise<AnnouncementRecord>;
  update(userId, { eventId, id, patch }): Promise<AnnouncementRecord>;   // 404
  remove(userId, { eventId, id }): Promise<void>;                        // 404
}
makePublicMessagingService(repos): {         // no auth — token only
  forToken(token): Promise<{ id; title; body; createdAt }[]>;            // [] if token invalid
}
```

`gateRead`/`gateWrite` follow the established pattern (membership + `content:edit` + `"messaging"` gate).
`PublicMessagingService.forToken` resolves the guest by token; if absent returns `[]`; otherwise lists the
event's announcements projected to the safe fields only.

## 7. API & UI

- tRPC `messaging` router: `list`/`create`/`update`/`remove` (authedProcedure), `publicForToken`
  (publicProcedure). Boundary `announcementInput` declared in the router (web `z`).
- **Host page** `…/event/[eventId]/messaging/page.tsx` + `actions.ts` — post form (title + body), list of
  announcements with edit + delete. Toolkit `BUILT` += `"messaging"`; `styles/messaging.css` `@import`ed.
- **Public** — extend `app/rsvp/[token]/page.tsx`: after the RSVP form, render an "Announcements" section
  from `messaging.publicForToken(token)` (hidden if empty).

## 8. Testing ladder

1. **DTO unit** — title/body bounds; trims; rejects empty.
2. **Service unit** (fakes) — host CRUD + 404s; ordering newest-first; cross-tenant denial; viewer-read-not-write;
   gate wired when `freeLaunch` off; public `forToken` returns safe fields for a valid token and `[]` for a bad one.
3. **Adapter integration** (real Postgres) — CRUD tenant-scoped; newest-first ordering; cascade with event.
4. **Router integration** — host CRUD via `createCaller`; `FORBIDDEN` non-member, `NOT_FOUND` unknown id;
   public `publicForToken` works with a **null user** and returns `[]` for a bad token.
5. **Playwright E2E** — host posts an announcement; the unauthenticated guest sees it on their RSVP page.
   Existing 8 specs stay green.

## 9. Naming scheme

`Announcement` (model/record) · `messaging` (module key, router, host route) · `announcementInput`/
`toAnnouncementWrite`/`toAnnouncementPatch` · `AnnouncementRepository`/`PrismaAnnouncementRepository` ·
`makeMessagingService`/`MessagingService` · `makePublicMessagingService`/`PublicMessagingService` ·
`addAnnouncementAction`/`editAnnouncementAction`/`removeAnnouncementAction`.

## 10. Non-goals (deferred)

Threaded/2-way chat · per-guest direct messages · email/SMS delivery · read receipts · scheduling/drafts ·
attachments · @mentions of collaborators. Each is a clean later slice.

## 11. Success criteria

- Every test rung green; full monorepo gate green.
- A host posts an announcement; an unauthenticated guest sees it via their RSVP link.
- The public projection leaks only `{id, title, body, createdAt}`; messaging owns its table and only reads
  guests to resolve the token — proving the broadcast pattern layers cleanly onto the public surface.
