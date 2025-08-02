# Technical Debt Report — Wedding Planner V2
Scope: Entire repository scan for dead code, redundancy/duplication, and code cruft. 
Constraint: Analysis only — no code changes were made.

Note: Line numbers are approximate ranges for multi-line contexts. Findings are grouped by category and domain.

--------------------------------------------------------------------------------
Executive Summary
- Mixed canonical table names across app and DB: "couples" vs "wedding_couples" (and similarly "guests" vs "wedding_guests"). This causes runtime errors (e.g., 406) and leads to duplicated policies and migrations. Unify naming.
- Redundant feature initialization patterns across hooks (tasks, budget, timeline) indicate code repetition that can be centralized into a shared “couple bootstrap” utility.
- Multiple dev/diagnostic pages and scripts remain in repo and may be obsolete in production; they inflate surface area and risk drift.
- Migrations and setup SQL contain legacy/overlapping definitions and compatibility layers; clean ordering and consolidation is needed to avoid confusion and drift.
- Tests, screenshots and playwright reports from earlier runs are present; keep them but ensure they’re not mistaken as active code.

--------------------------------------------------------------------------------
A. Dead Code (likely unused exports/modules, routes, or assets)

1) Dev/diagnostic pages and scripts
- File: src/app/test-nav/page.tsx
  - Lines: ~1-80
  - Issue: Diagnostic page calling `.from('wedding_couples')`. No clear linkage from main navigation; likely ad-hoc debug. 
  - Evidence: Search shows limited references to this page outside tests. 
  - Impact: Dead/diagnostic code risks drift and inconsistent table usage.
  - Suggestion: Tag as dev-only or remove from production routes.

- File: src/app/env-debug/page.tsx
  - Lines: ~1-120
  - Issue: Environment inspection page with explicit display of Supabase values; useful in dev, not in prod.
  - Impact: Dead in prod; potential info exposure if deployed.
  - Suggestion: Restrict to dev-only or guard with admin/mode flag.

- Files: debug-* scripts at root (debug-login-flow.js, debug-homepage.png, detailed-* test scripts)
  - Lines: entire files
  - Issue: Purely diagnostic; no runtime references.
  - Suggestion: Move to a /devtools/ folder or exclude from production bundles.

2) Redundant/unused Supabase client initializers
- Files:
  - src/lib/supabase.ts (client with typed Database and helpers)
  - src/lib/supabase-client.ts (browser/server split with cookies())
  - src/lib/supabase-server.ts (server helper also querying wedding_couples)
  - Lines: entire files
  - Issue: Multiple initializers can diverge; some helpers likely unused across the app or overlap in functionality.
  - Evidence: Search shows many API routes creating their own client via auth-helpers; these central libs may be partially unused.
  - Suggestion: Keep one canonical server and one browser client helper; others flagged for potential removal after verification.

3) Unreferenced assets
- Files: public/*.svg, public/icons/*.svg, screenshots (theme-test-screenshot.png, beautiful-landing-*.png, etc.)
  - Lines: entire files
  - Issue: Some images/icons may be unused. 
  - Evidence: No programmatic reference scan detected; manual verification required.
  - Suggestion: Create an asset reference map; flag assets not referenced in code or docs.

--------------------------------------------------------------------------------
B. Redundancy / Duplicated Logic

1) Canonical table name mismatch (couples vs wedding_couples)
- Files: 
  - src/lib/supabase-server.ts (~queries wedding_couples)
  - src/components/vendors/VendorCalendar.tsx (nested selection `couple:wedding_couples(...)`)
  - src/app/api/settings/profile/route.ts (~queries & updates wedding_couples)
  - src/app/dashboard/{photos,seating,calendar}/page.tsx (~queries wedding_couples)
  - src/app/dev-login/page.tsx (select/insert into wedding_couples)
  - scripts/{create-dev-user.js, reset-dev-password.js, test-auth.js} (~use wedding_couples)
  - supabase/migrations/* with both: 
    - 20250801024613_fix_table_names.sql (rename couples→wedding_couples)
    - 20250108121000_fix_table_references.sql (creates couples view pointing to wedding_couples)
  - setup-*.sql scripts referencing wedding_couples
  - Docs: database-audit-report.md (explicitly mentions mismatch)
- Issue: Redundant naming triggers duplication of policies/migrations and confuses client code.
- Suggestion: Choose one canonical name, provide a compatibility view for the other, and standardize all app queries.

2) Repeated “initialize defaults if not present” patterns across hooks
- Files:
  - src/hooks/useTasks.ts: initializeDefaultTasks (lines ~160-240)
  - src/hooks/useBudget.ts: initializeDefaultCategories (lines ~120-200)
  - src/hooks/useTimeline.ts: initializeDefaultTimeline (lines ~140-220)
- Issue: Similar patterns setting up initial data for a couple are duplicated across modules.
- Suggestion: Factor a shared server utility (not refactoring now) and reduce duplication in future.

3) API routes duplicated couple fetch boilerplate
- Files: src/app/api/**/route.ts (many routes)
  - Lines: Typically top 30-60 lines per file
  - Issue: Each route repeats “get session -> fetch couples.id” logic with variations.
  - Suggestion: Reported as redundancy; can be centralized in a server helper.

4) Messaging features: overlapping logic across hooks/components
- Files: src/hooks/useMessaging.ts (multiple sections for conversations, messages, typing, upload)
  - Lines: Multiple large blocks (~1-400)
  - Issue: Similar fetch/update patterns with duplication (update local state after Supabase call); could be abstracted into a shared messaging service.
  - Suggestion: Identify shared utility patterns to DRY in future refactor.

--------------------------------------------------------------------------------
C. Code Cruft (commented-out code, legacy configs, stale migrations/docs)

1) Commented/diagnostic code and broad narrative comments inflating files
- Files: 
  - src/lib/messaging/external-messaging.ts (multiple commented blocks like “// Send via SMS/WhatsApp/Email”, media limits; lines spread across ~1-500)
  - src/hooks/** (various verbose comments describing “bulletproof” handling, “load on mount” etc.)
  - src/hooks/useTouchRipple.ts, useSwipeGesture.ts, useHapticFeedback.ts (long blocks of inline narrative comments)
- Issue: Comment density makes real issues harder to spot; some comments describe behavior that should be self-evident or outdated.
- Suggestion: Trim verbose or stale comments; keep only clarifying comments for edge cases. (Report only.)

2) Legacy migration layering and compatibility artifacts
- Files:
  - supabase/migrations/20250801024613_fix_table_names.sql (renames couples→wedding_couples)
  - supabase/migrations/20250108121000_fix_table_references.sql (creates view couples→wedding_couples; sets security_invoker)
  - setup-seating-tables.sql, setup-vendor-calendar.sql (duplicate RLS and references to wedding_couples)
- Issue: Overlapping migrations can confuse DB state and auditors; compatibility views might be stale or missing in cloud.
- Suggestion: Consolidate migration ordering in MIGRATIONS.md and remove redundant ad-hoc setup scripts once applied. (Report only.)

3) Dev/diagnostic artifacts in repo root
- Files: dev-server.log, dev-server-new.log, server.log, *.png screenshots (signin-*, budget-*, etc.)
- Issue: Logs and screenshots are fine but not relevant to runtime; cruft if committed without clear folder separation.
- Suggestion: Keep in /test-results or /docs/screens; exclude from production artifacts.

4) Public service worker strategy check (possible legacy code)
- Files: public/sw.js
  - Lines: entire file
  - Issue: Without reading, typical SW files accrue legacy strategies; check for stale caches and outdated event handlers.
  - Suggestion: Audit strategy against current PWA components (PWAProvider, UpdatePrompt); mark unused cache versions.

--------------------------------------------------------------------------------
D. Potential Dead/Unused Code by heuristics (needs confirmation)

1) src/components/WeddingStudioApp.tsx and src/components/wedding-studio/WeddingStudioApp.tsx
- Lines: entire files
- Issue: Two similarly named components; unclear if both are used. 
- Suggestion: Check imports/routes for actual usage; one may be legacy.

2) src/app/auth-test, src/app/debug-dashboard, src/app/signin-debug
- Lines: entire routes
- Issue: Debug-only pages that likely aren’t part of main UX. 
- Suggestion: Mark dev-only and exclude from production routing.

3) src/components/pwa/* 
- Lines: entire folder
- Issue: PWA components are present (NetworkStatus, UpdatePrompt, InstallPrompt). Verify all are mounted in app tree; unused pieces are dead code.

--------------------------------------------------------------------------------
E. File-specific observations (with approximate line spans)

1) src/lib/supabase-server.ts
- Lines: ~1-80
- Issue: .from('wedding_couples') hard-coded; mismatch with other parts using 'couples'.
- Category: Redundancy/Schema drift
- Suggestion: Standardize table naming project-wide; consider using a single helper to resolve the table/view.

2) src/components/vendors/VendorCalendar.tsx
- Lines: ~80-140
- Issue: Nested relation alias using wedding_couples; mismatched with other modules.
- Category: Redundancy/Schema drift

3) src/app/api/settings/profile/route.ts
- Lines: ~1-120
- Issue: Queries & updates wedding_couples; schema drift.
- Category: Redundancy/Schema drift

4) supabase/migrations/20250108121000_fix_table_references.sql
- Lines: ~1-80
- Issue: Creates couples view pointing to wedding_couples; compatibility layer.
- Category: Cruft/Legacy layer (if canonical table is already unified)
- Suggestion: Keep or remove based on canonical decision, but document ordering.

5) scripts/create-tables.sql
- Lines: ~1-200+
- Issue: Creates public.wedding_couples and multiple RLS; duplicates policies scattered across other migrations.
- Category: Cruft/Redundancy
- Suggestion: Migration source of truth should be in supabase/migrations not scripts/.

6) src/app/dev-login/page.tsx
- Lines: ~1-220
- Issue: Inserts/selects wedding_couples, populates dev couple; likely dev-only path.
- Category: Dead/Dev code in prod context

--------------------------------------------------------------------------------
F. Tests and Mocks

1) src/__tests__/helpers/test-utils.tsx
- Lines: ~1-300
- Issue: Large helper includes a lot of mock scaffolding; ensure all helpers are used. Unused mocks are dead code.
- Suggestion: Track references to each exported helper to prune unused ones later.

2) playwright-report/index.html and test-results/*.png
- Lines: N/A
- Issue: Generated artifacts stored in repo; keep them intentional, but mark as generated to avoid confusion with sources.

--------------------------------------------------------------------------------
G. Documentation and Reports

1) database-audit-report.md
- Lines: ~1-200
- Issue: States canonical change couples→wedding_couples and highlights mismatch. 
- Category: Documentation indicates technical debt is known; ensure app code is adjusted accordingly or a compat view is guaranteed in cloud.

2) Multiple docs in docs/ (PWA, TIMELINE, BUDGET)
- Lines: entire files
- Issue: Docs are good; verify alignment with current code to avoid stale guidance.

--------------------------------------------------------------------------------
Prioritized Recommendations (non-code actions)
1) Decide canonical table naming for “couple” and “guest” domain and document it in MIGRATIONS.md. Ensure a compatibility view exists for the non-canonical name in cloud (security_invoker) until all code is standardized.
2) Create a DB access layer agreement: one server initializer and one browser initializer in src/lib; route/API code should consume these to avoid drift.
3) Catalog dev-only pages and scripts; mark them as dev-only or remove from prod routing. 
4) Centralize “initialize defaults if missing” into a shared server utility for the future (tasks/budget/timeline).
5) Clean migration stack: ensure setup-*.sql scripts don’t overlap with migrations applied in cloud; move ad-hoc table creation into formal migrations if still needed.
6) Audit PWA service worker for cache/version strategy alignment with current PWA components.
7) Asset map: enumerate icons/images and mark unused assets for potential deletion later.

--------------------------------------------------------------------------------
Appendix A — Search Heuristics Used
- Table name mismatches: “wedding_couples” vs “couples”, “wedding_guests” vs “guests”.
- Diagnostic markers: dev/debug pages, scripts using service role keys or env dumps.
- Redundancy in hooks: initialize default X for couple and repeated fetch/update patterns.
- Comment density: long narrative comments; commented-out code hints.

--------------------------------------------------------------------------------
Appendix B — Candidate Files for Follow-up Review
- src/lib/supabase.ts, src/lib/supabase-client.ts, src/lib/supabase-server.ts (consolidate)
- src/app/api/**/route.ts (centralize couple fetch/auth pattern)
- src/app/dev-login/page.tsx, src/app/env-debug/page.tsx, src/app/test-nav/page.tsx (dev-only)
- scripts/create-tables.sql vs supabase/migrations/* (migrate to unified migration flow)
- public/sw.js (review for stale caches)
- src/components/wedding-studio/* (verify usage vs legacy)

End of report.
