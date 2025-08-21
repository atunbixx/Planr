# Super Admin Dashboard — Technical Spec (v1)

## Goals
- Centralize operational visibility and control: users, vendors, directory, subscriptions, payments, support, staff, sessions.
- Provide moderation workflows (reviews, flags, suspensions, ownership requests).
- Show trends (growth, geography, revenue) for product direction.
- Design to be progressively enhanced; gated by env flag + admin email allowlist.

## Access Control
- Gate by env: `ADMIN_ENABLED` must be `true`.
- Allowlist: `ADMIN_EMAILS` (comma-separated). Checked via `isSuperAdmin(user)`.
- Wrapper: `requireSuperAdmin(handler)` built on top of existing `requireAuth`.
- Audit every mutation: write to an `admin_audit_logs` table (future).

## Initial Scope (Phase 1)
- Overview: totals (users, private vendors, directory vendors), region breakdown.
- User management: list/search users; view profile; deactivate/reactivate.
- Directory moderation: list flagged vendors; resolve flags; suspend/unsuspend.
- Support queue: basic ticket list (future model); assign, status.
- Sessions: list active sessions (future model) by user; revoke.
- Billing: plans, subscriptions, invoices, payments (Stripe integration future).

## Data Model (Proposed Additions)
- `AdminAuditLog`: id, adminUserId, action, targetType, targetId, details JSON, ip, ua, createdAt.
- `Subscription`: id, userId, planId, status, currentPeriodEnd, trialEnd, meta, createdAt, updatedAt.
- `Payment`: id, userId, provider, amount, currency, status, externalId, createdAt.
- `SupportTicket`: id, userId, subject, body, status, assignedTo, priority, labels[], createdAt, updatedAt.
- `Session`: id, userId, ipHash, uaHash, lastActiveAt, region, createdAt, revokedAt.
- Extend `DirectoryVendor` (done): normalized contact + flags and suspension.

## APIs (Phase 1)
- `GET /api/admin/overview`: safe counts + region breakdown.
- `GET /api/admin/users`: list/search/sort/paginate users.
- `PATCH /api/admin/users/[id]`: deactivate/reactivate; set role/flags (with audit).
- `GET /api/admin/directory/vendors`: list with filters (`fraudFlags`, `isSuspended`).
- `PATCH /api/admin/directory/vendors/[id]`: set flags/suspend/unsuspend.
- (Later) `GET /api/admin/billing/*`, `GET /api/admin/support/*`, `GET /api/admin/sessions/*`.

## UI (Phase 1)
- Shell at `/admin` with cards for overview.
- Sections: Users, Directory, Support, Billing, Sessions, Staff, Settings, Logs.
- Use MUI components aligned with existing aesthetic; SSR for pages; client fetches gated APIs with token.

## Security
- Strict gating: env + allowlist.
- CSRF: use same JSON/fetch model as app; auth via bearer.
- Rate limit admin APIs (future middleware).
- Audit log all admin writes (Phase 2).

## Analytics & Trends
- Event collection (Phase 2): `events` table for key app actions (signup, vendor create, inquiry). Roll up into daily aggregates for charts.
- Geo: derive from preferences or IP-to-country (opt-in, privacy-compliant).

## Rollout Plan
1. Ship behind `ADMIN_ENABLED=false`, admin allowlist only.
2. Start with `overview` and `directory moderation (read-only)`.
3. Add write actions with audit logging.
4. Expand to users, billing, support, sessions.

## Testing
- Unit test normalize utils.
- Manual smoke of `/api/admin/overview` with/without flags.
- E2E once admin flows mature.

## Notes
- No schema changes required to existing flows except optional admin tables added later.
- Keep all admin routes isolated under `/api/admin/*` and `/admin`.
