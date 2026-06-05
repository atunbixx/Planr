---
title: Planr Admin — Design Spec (seventh feature; org-scoped console, mostly composition)
date: 2026-06-05
status: approved
type: design-spec
tags: [planr, feature, admin, workspace, rbac, multi-tenant]
owner: atunbi
relates: [2026-06-04-planr-foundation-design.md, 2026-06-05-planr-guest-list-design.md]
---

# Planr Admin — Design Spec

> The final module, and a different shape: an **org-scoped console** (not an event tool), owner/admin only.
> It mostly **composes existing services** — member/role/invite management already lives in the
> collaboration service with last-owner guards — so the new surface is small: workspace rename/delete,
> a gated settings view, exposing two existing service methods, and the page.

## 1. Goal & context

A workspace owner/admin manages the workspace itself: **rename** it, **delete** it (owner only), manage
**members** (change role, remove), and manage **invitations** (invite, revoke pending). Permission-gated by
RBAC (`member:invite`, `member:remove`, `org:delete`) — **not** the per-event module gate.

## 2. What already exists (reused as-is)

| Capability | Where | Gate |
|---|---|---|
| List members (with users) | `collaboration.listMembers` | membership |
| Change a member's role (last-owner-safe) | `collaboration.setMemberRole` | `member:remove` |
| Remove a member (last-owner-safe) | `collaboration.removeMember` | `member:remove` |
| Invite by email | `collaboration.invite` | `member:invite` |
| List pending invitations | `collaboration.listPendingInvitations` | membership |
| Revoke a pending invitation | `collaboration.revokeInvitation` | `member:remove` |

`setMemberRole` and `revokeInvitation` exist in the service but aren't on the router yet — Admin just
**exposes** them. No new member/role/invite logic is written.

## 3. What's genuinely new

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Workspace rename | `orgs.rename` (repo) + `tenancy.renameOrganization` (gated `member:invite`) | Owner/admin can rename; small lifecycle add |
| 2 | Workspace delete | `orgs.delete` (repo, FK-cascades everything) + `tenancy.deleteOrganization` (gated `org:delete`) | Destructive → **owner only**; cascade frees all child rows |
| 3 | Gated console view | `tenancy.workspaceSettings(userId, {organizationId})` gated `member:invite` → `{ organization, members, pendingInvitations }` | One gated read so the page is owner/admin-only at the data layer |
| 4 | Surface | An `admin` router (settings/rename/delete) + `collaboration` router gains `setMemberRole`/`revokeInvitation` | Keep member ops in collaboration; workspace ops in admin |
| 5 | Entry point | A "Workspace settings" link on the org dashboard (`/dashboard/org/[orgId]`), shown to all but gated server-side | Admin is org-scoped, not in the per-event toolkit |
| 6 | Role-change scope | Reuses `setMemberRole`'s guards: can't demote the **last owner** | Already enforced; no lockout |

## 4. Data model

No new tables. `OrganizationRepository` gains:

```ts
rename(input: { id: string; name: string }): Promise<OrganizationRecord>;
delete(id: string): Promise<void>;   // FK cascade removes memberships, events, guests, … 
```

`orgs.delete` relies on the existing `onDelete: Cascade` FKs from every child table to `Organization`.

## 5. Services (tenancy gains 3 methods; collaboration unchanged)

```ts
tenancy.workspaceSettings(userId, { organizationId }):
  Promise<{ organization: OrganizationRecord; members: MemberView[]; pendingInvitations: InvitationRecord[] }>;  // gate member:invite
tenancy.renameOrganization(userId, { organizationId, name }): Promise<OrganizationRecord>;                       // gate member:invite
tenancy.deleteOrganization(userId, { organizationId }): Promise<void>;                                           // gate org:delete (owner)
```

`renameOrganization` validates `name` (1–80, trimmed) before writing.

## 6. API & UI

- **`admin` router** (authed): `settings`, `rename`, `deleteWorkspace`.
- **`collaboration` router** gains: `setMemberRole`, `revokeInvitation` (thin pass-throughs to the existing service).
- **Admin page** `…/dashboard/org/[orgId]/admin/page.tsx` + `actions.ts`:
  - **Workspace** — rename form; **danger zone** delete (owner only; type-to-confirm via a required text input matching the name).
  - **Members** — list with a role `<select>` (change) + Remove; the current user's own row is not role-editable/removable.
  - **Invitations** — invite form + pending list with Revoke.
  - The page fetches `admin.settings`; if it throws `FORBIDDEN` (non-admin), redirect to the org dashboard.
  - A "Workspace settings" link is added to the org dashboard. `styles/admin.css` `@import`ed.

## 7. Testing ladder

1. **Service unit** (fakes) — rename validates + persists; delete removes the org and (via fakes) its members;
   `workspaceSettings` returns composed data and is gated `member:invite`; `deleteOrganization` gated `org:delete`
   (an admin who lacks it is forbidden); rename forbidden for a viewer.
2. **Adapter integration** (real Postgres) — `rename`; `delete` cascades (org gone → its events/guests gone).
3. **Router integration** — `admin.settings` FORBIDDEN for a viewer, OK for owner; `setMemberRole` changes a role
   and is FORBIDDEN for a viewer; `admin.deleteWorkspace` FORBIDDEN for an admin without `org:delete`, OK for owner.
4. **Playwright E2E** — owner renames the workspace, invites + changes a member's role, deletes the workspace
   (type-to-confirm) → redirected to dashboard with it gone. Existing 9 specs stay green.

## 8. Naming scheme

`admin` (router, route segment) · `tenancy.workspaceSettings`/`renameOrganization`/`deleteOrganization` ·
`orgs.rename`/`orgs.delete` · `collaboration.setMemberRole`/`revokeInvitation` ·
`renameWorkspaceAction`/`deleteWorkspaceAction`/`setRoleAction`/`removeMemberAction`/`inviteAction`/`revokeInviteAction`.

## 9. Non-goals (deferred)

Ownership transfer (promote-to-owner) · audit log · billing/seat management · bulk member import · SSO/domain
capture · per-member activity. Each is a clean later slice.

## 10. Success criteria

- Every test rung green; full monorepo gate green.
- An owner manages members, roles, invitations, and the workspace lifecycle from one console; a non-admin can't.
- Admin adds almost no new domain logic — it composes the RBAC + collaboration + tenancy primitives already
  built — confirming the foundation was right from the onset.
