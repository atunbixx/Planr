# Wedding Planner V2 - Priority-Ordered TODO

## Critical (Do Next)
1) Security enforcement for public endpoints (RSVP rate limits + IP blocklist)
- Urgency: High
- Impact: Prevents abuse, protects data and infra costs
- Actions:
  - Implement middleware on public RSVP API routes reading `rsvp_rate_limits` and `rsvp_ip_blocklist`.
  - Enforce per-IP and per-invite code thresholds with 429 responses.
  - Log blocks/suspicious activity to `rsvp_security_audit`.
  - Add Playwright tests for blocked flows and success paths.

2) Centralize data access to server (reduce client-side table queries)
- Urgency: High
- Impact: Security and performance; reduces client exposure of query logic
- Actions:
  - Create server-side data layer (e.g., `src/lib/server/db.ts`) wrapping Supabase queries with couple scoping and input validation.
  - Migrate heavy dashboard queries from client components to server components/actions.
  - Add input schemas (zod) and defensive checks.

3) Migration order + DX scripts
- Urgency: High
- Impact: Reliability for team/CI, avoids schema drift
- Actions:
  - Add `MIGRATIONS.md` documenting exact order for RSVP, Messaging, Budget.
  - Provide npm scripts: `migrate:apply`, `migrate:reset`, `seed:dev`.
  - Adopt a migration runner (Supabase CLI or simple Node runner applying `src/sql` in order) and use in CI.

4) Index and query plan audit for analytics dashboards
- Urgency: High
- Impact: Performance, scalability
- Actions:
  - Identify top queries in Budget/RSVP dashboards; run `EXPLAIN ANALYZE`.
  - Add composite indexes on `(couple_id, status/date/type)` per query.
  - Record before/after timings in `PERFORMANCE_NOTES.md`.

## Important (Next 1–2 Sprints)
5) PWA service worker review and update flow
- Urgency: Medium
- Impact: Offline reliability and update UX
- Actions:
  - Validate caching strategies per route (static vs API).
  - Ensure `skipWaiting/clientsClaim` are correct and UpdatePrompt triggers reliably.
  - Add E2E tests simulating SW install, offline, and update.

6) Realtime messaging robustness and tests
- Urgency: Medium
- Impact: Core UX for vendor communications
- Actions:
  - Add unit/integration tests for `vendor_messages`, typing, reactions using mocked channels.
  - Backoff/retry logic for channel reconnects.
  - Moderate attachment types and sanitize content.

7) Environment documentation and secrets hygiene
- Urgency: Medium
- Impact: Onboarding and correctness
- Actions:
  - Add `.env.example` with all required keys.
  - README quickstart: scripts, migrations, auth setup.
  - Verify no secrets logged or shipped to client.

8) Server-side rate-limited exports and long lists
- Urgency: Medium
- Impact: Stability under load
- Actions:
  - Stream CSV/Excel from server for RSVP/Budget exports.
  - Add pagination/virtualization for large lists (RSVP tables, Photos).
  - Add route-level throttling on exports.

## Enhancements (Planning)
9) Budget module polish
- Urgency: Low
- Impact: Financial clarity and trust
- Actions:
  - Lock budget periods; add reconciliation workflow and history.
  - Expose budget health score factors transparently.
  - Batch notifications for payment reminders.

10) Seating and Timeline UX improvements
- Urgency: Low
- Impact: Usability at scale
- Actions:
  - Undo/redo for seating changes.
  - Throttle drag events and virtualize lists.
  - Add task templates and quick actions in timeline.

11) Photos pipeline hardening
- Urgency: Low
- Impact: Storage cost and user experience
- Actions:
  - Validate size/type; background thumbnail generation via Edge functions.
  - Cleanup jobs for orphaned files and failed uploads.

---

## Scorecard

### What’s done well
- Data modeling and RLS — 9/10
  - Rich schema, granular RLS, analytic views/functions, Realtime publications.
- Module breadth and cohesion — 8.5/10
  - Budget, RSVP, Seating, Vendors/Messaging, Photos, Timeline.
- PWA foundation — 8/10
  - Manifest, SW, offline fallback, install/update prompts, network indicators.
- Testing foundation — 7.5/10
  - Playwright E2E and Jest/RTL with helpers and mocks.

### What to improve
- Server-side data access centralization — 6/10 (target 9/10)
  - Move critical queries to server; standardize couple scoping and validation.
- Security enforcement at API/middleware — 6.5/10 (target 9/10)
  - Actively use RSVP security tables to block abuse and log events.
- Migration order + CI reliability — 6.5/10 (target 9/10)
  - Deterministic migrations, scripts, and CI step to avoid drift.
- Performance/indexing for dashboards — 7/10 (target 9/10)
  - Systematic EXPLAIN, composite indexes, measurements recorded.
- Realtime resiliency and tests — 6.5/10 (target 8.5/10)
  - Reconnect/backoff patterns and testing around live updates.

---

## Suggested implementation sequence (90-day plan)

Week 1–2
- Implement RSVP middleware for rate limits + IP blocklist; add tests.
- Add `MIGRATIONS.md`, `.env.example`, bootstrap scripts.
- Start centralizing queries for top dashboard pages to server components/actions.

Week 3–4
- Run query audits on Budget/RSVP; add indexes and document improvements.
- Realtime messaging test suite; add reconnect logic.

Week 5–6
- PWA audit and tests for install/offline/update flows.
- Export streaming and pagination/virtualization for large datasets.

Week 7–9
- Budget period locking and reconciliation history.
- Seating undo/redo and performance tuning.
- Photo pipeline hardening and cleanup jobs.
