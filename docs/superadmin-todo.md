# SuperAdmin/Moderator Dashboard — TODO Roadmap

This is a living checklist to grow the superAdmin dashboard into a robust, full‑featured control center. Everything ships behind `ADMIN_ENABLED` and the admin allowlist.

## Core Admin Shell
- [ ] Navigation: persistent admin toolbar + breadcrumbs
- [ ] RBAC: superAdmin, moderator, support, finance roles
- [ ] Rate limiting: move to Redis; per‑route policies; headers everywhere
- [ ] Audit logs: searchable, filters (admin, action, target), diff view, export CSV
- [ ] Admin activity feed widgets on overview

## Users
- [ ] Search by email/id/date range/tags
- [ ] Deactivate/reactivate (done)
- [ ] Role changes (done); add staff roles; history timeline
- [ ] Impersonation (done); add banner for original admin email
- [ ] Bulk actions (email, deactivate)
- [ ] GDPR tools: export/delete on demand

## Directory Moderation
- [ ] Anti‑duplication (basic done): add backfill job + tunable thresholds
- [ ] Flag management: add resolve/notes/owner handoff
- [ ] Ownership claims: request/verify, merge duplicates
- [ ] Media moderation: images/videos scanning pipeline
- [ ] Suspensions (done); add reason + duration + notify owner

## Vendor Panel (Admin)
- [ ] Overview: KPIs (new vendors, flagged, suspended, inquiries 7/30d)
- [ ] Vendor detail: contacts, performance, inquiries timeline, flags
- [ ] Actions: verify, approve, suspend/unsuspend, merge, transfer ownership
- [ ] Pricing plans: assign plan, view invoices, disable listing on non‑pay
- [ ] Messaging oversight: response SLAs, canned responses library

## Vendor Portal (Vendor‑facing)
- [ ] Onboarding: category/region, profile completeness meter
- [ ] Media: gallery, cover, logo with transforms & safety checks
- [ ] Productization: packages, price bands, availability calendar
- [ ] Lead inbox: inquiries, statuses, quotes, templates, attachments
- [ ] Reviews: request/reply; abuse reporting & moderation hooks
- [ ] Insights: views, CTR, lead rate, bookings; export CSV
- [ ] Billing: subscriptions (Stripe), invoices, payouts (future)

## Marketplace & Directory (Public)
- [ ] Filters: rich facets, region → city drill‑down, price/rating sliders
- [ ] SEO: static category/region pages, sitemaps, schema.org
- [ ] Performance: edge caching, ISR, image optimization, CDN hints
- [ ] Anti‑spam: IP/email/phone heuristics, captcha fallback, velocity rules

## Support & Staff
- [ ] Support tickets: triage, assignment, SLAs, canned replies
- [ ] Staff roles & permissions; audit every change
- [ ] Session viewer (done basic): add device fingerprints + revoke all

## Billing & Finance
- [ ] Stripe integration: customers, subs, invoices, refunds
- [ ] Revenue dashboard: MRR, churn, cohorts, plan mix
- [ ] Tax & invoicing: PDF receipts; tax IDs; localization

## Analytics & Trends
- [ ] Events collection: structured app events; daily rollups
- [ ] Geo dashboards: countries/regions, per‑category heatmaps
- [ ] Funnel metrics: signup → onboarding → first vendor → booking

## Security & Privacy
- [ ] Admin 2FA, SSO (OIDC)
- [ ] Secrets hygiene; read‑only replicas for admin reads
- [ ] DLP for support views; PII masking where appropriate
- [ ] Compliance: data retention windows & purge jobs

## Testing & Ops
- [ ] Integration tests for admin APIs; playwright smoke for UI
- [ ] Seed data & fixtures for demos
- [ ] Observability: logs, metrics, traces for admin endpoints
- [ ] Feature flags to safely roll out subpages

---

Implementation Note: keep admin code isolated under `/admin` and `/api/admin/*`; always gate via `requireSuperAdmin`. Prefer read‑only first, then add mutations with audit entries.
