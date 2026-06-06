# Planr Web UI & Playwright E2E — Implementation Plan (Plan 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the browser layer to `@planr/web` — Supabase email/password auth pages and a dashboard that drives the Plan 3 tRPC API (sign up → create organization → create a wedding event → see entitlement-gated modules) — and prove the whole flow end-to-end with Playwright against the local Supabase stack.

**Architecture:** Server Components read through a per-request authed tRPC caller (`getServerCaller`), and Server Actions perform mutations through the same caller — so the UI reuses the Plan 3 authorization model with zero duplication. Auth is client-side Supabase (`@supabase/ssr` browser client); the existing middleware refreshes the session cookie so Server Components see the signed-in user. The Plan 3 carry-over (email-less sessions colliding on `User.email`) is fixed by making `email` nullable.

**Tech Stack:** Next.js 15 App Router (Server Components + Server Actions), `@supabase/ssr` browser client, `@playwright/test`, the Plan 3 tRPC API.

**Reference spec:** `docs/superpowers/specs/2026-06-04-planr-foundation-design.md` (§8 auth amended to Supabase).
**Builds on:** Plan 3 (branch `foundation-redesign`). Local Supabase up via `supabase start` (API `http://127.0.0.1:54421`, DB `:54422`).

**Environment facts:** pnpm 10.32.1; local Supabase on the +100 ports; `TEST_DATABASE_URL`/`DATABASE_URL` = `postgresql://postgres:postgres@127.0.0.1:54422/postgres` for integration tests; Playwright needs `npx playwright install chromium`.

---

## File structure (locked)

```
packages/db/prisma/schema.prisma                       # email String? (Task 1)
packages/db/prisma/migrations/<ts>_nullable_user_email/   (Task 1)
packages/core/src/ports/repositories.ts                # email: string | null (Task 1)
packages/core/src/services/tenancy.service.ts          # AuthUserInput.email nullable (Task 1)
packages/db/src/repositories/user.repository.ts        # email mapping (Task 1)
apps/web/src/app/api/.../auth.ts (getCurrentUser)      # email ?? null (Task 1)
apps/web/src/lib/supabase/client.ts                    # browser client (Task 2)
supabase/config.toml                                   # enable_confirmations=false (Task 2)
apps/web/src/app/sign-up/page.tsx                      # signup form (Task 3)
apps/web/src/app/sign-in/page.tsx                      # signin form (Task 3)
apps/web/src/components/sign-out-button.tsx            # client signout (Task 3)
apps/web/src/server/caller.ts                          # getServerCaller() (Task 4)
apps/web/src/app/dashboard/page.tsx                    # orgs list + create (Task 4)
apps/web/src/app/dashboard/actions.ts                  # server actions (Task 4)
apps/web/src/app/dashboard/org/[orgId]/page.tsx        # events list + create (Task 5)
apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/page.tsx  # modules (Task 5)
apps/web/playwright.config.ts                          # E2E config (Task 6)
apps/web/e2e/slice.spec.ts                             # full-slice E2E (Task 6)
apps/web/package.json                                  # @playwright/test + e2e script (Task 6)
```

---

## Task 1: Make `User.email` nullable (fix the Plan 3 carry-over)

Email-less Supabase sessions (anonymous/phone) would otherwise collide on `email=""`. Nullable `@unique` lets multiple NULLs coexist in Postgres.

**Files:** Modify `packages/db/prisma/schema.prisma`, `packages/core/src/ports/repositories.ts`, `packages/core/src/services/tenancy.service.ts`, `packages/db/src/repositories/user.repository.ts`, `apps/web/src/server/auth.ts`; create a migration; add a test in `packages/db/src/repositories/repositories.int.test.ts`.

- [ ] **Step 1: Schema — make email optional**

In `packages/db/prisma/schema.prisma`, change the `User.email` line from `email String @unique` to:
```prisma
  email       String?      @unique
```

- [ ] **Step 2: Create the migration**

Create `packages/db/prisma/migrations/20260605090000_nullable_user_email/migration.sql`:
```sql
-- Allow email-less auth users (anonymous/phone). NULLs are distinct in a unique index.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
```
Apply it to the local Supabase main DB:
```bash
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' \
  pnpm --filter @planr/db exec prisma migrate deploy --schema prisma/schema.prisma
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
```
Expected: "All migrations have been successfully applied".

- [ ] **Step 3: Widen the types to `string | null`**

In `packages/core/src/ports/repositories.ts`:
- `UserRecord.email`: change `email: string;` → `email: string | null;`
- `UserRepository.upsertByAuthUserId` input: change `email: string;` → `email: string | null;`

In `packages/core/src/services/tenancy.service.ts`, change `AuthUserInput`:
```ts
export interface AuthUserInput {
  authUserId: string;
  email: string | null;
  name: string | null;
}
```

In `packages/db/src/repositories/user.repository.ts`, change the `upsertByAuthUserId` input type `email: string;` → `email: string | null;` (the returned `row.email` is already `string | null` after regenerating the client; the mapping `email: row.email` now typechecks).

- [ ] **Step 4: Pass null (not "") from getCurrentUser**

In `apps/web/src/server/auth.ts`, change:
```ts
    email: user.email ?? null,
```
(was `user.email ?? ""`).

- [ ] **Step 5: Add a regression test (multiple null-email users)**

In `packages/db/src/repositories/repositories.int.test.ts`, add inside the `describe`:
```ts
  it("allows multiple users with a null email", async () => {
    const a = await repos.users.upsertByAuthUserId({ authUserId: "auth_n1", email: null, name: null });
    const b = await repos.users.upsertByAuthUserId({ authUserId: "auth_n2", email: null, name: null });
    expect(a.id).not.toBe(b.id);
    expect(a.email).toBeNull();
  });
```

- [ ] **Step 6: Verify everything green**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm typecheck 2>&1 | grep Tasks:
pnpm lint; echo "lint=$?"
pnpm test 2>&1 | grep "Tests "
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/db run test:int 2>&1 | grep "Tests "
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' pnpm --filter @planr/web run test:int 2>&1 | grep "Tests "
```
Expected: typecheck 4/4, lint=0, offline 47, db-int 10 (was 9), web-int 4.

- [ ] **Step 7: Commit**

```bash
git add packages/db packages/core apps/web/src/server/auth.ts
git commit -m "fix(db,core): make User.email nullable so email-less auth sessions don't collide

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Supabase browser client + disable local email confirmations

**Files:** Create `apps/web/src/lib/supabase/client.ts`; modify `supabase/config.toml`.

- [ ] **Step 1: Browser client (reads only NEXT_PUBLIC_* — never the server env module)**

Create `apps/web/src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

// NOTE: read NEXT_PUBLIC_* from process.env directly (Next inlines them at build).
// Do NOT import ../../env here — that runs the full server-side parseEnv (incl. the
// secret key) which is not available in the browser bundle.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

- [ ] **Step 2: Ensure signups create a session immediately (no email confirmation in local dev)**

In `supabase/config.toml`, find the `[auth.email]` section and set `enable_confirmations = false` (it is usually already false; make it explicit). Confirm `[auth]` has `enable_signup = true`. Then restart so the change takes effect:
```bash
cd /Users/papii/Planr
grep -nA3 '\[auth.email\]' supabase/config.toml | head
supabase stop >/dev/null 2>&1; supabase start 2>&1 | tail -3
```
Expected: stack restarts; `supabase status` shows the API on `http://127.0.0.1:54421`.

- [ ] **Step 3: Typecheck + commit**

Run `pnpm --filter @planr/web typecheck; echo "tc=$?"` → 0. Commit:
```bash
git add apps/web/src/lib/supabase/client.ts supabase/config.toml
git commit -m "feat(web): Supabase browser client; disable local email confirmations

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Auth pages (sign-up, sign-in) + sign-out

**Files:** Create `apps/web/src/app/sign-up/page.tsx`, `apps/web/src/app/sign-in/page.tsx`, `apps/web/src/components/sign-out-button.tsx`.

- [ ] **Step 1: Sign-up page**

Create `apps/web/src/app/sign-up/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main>
      <h1>Create your Planr account</h1>
      <form onSubmit={onSubmit}>
        <input
          aria-label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          aria-label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign up</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <p>
        Already have an account? <a href="/sign-in">Sign in</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Sign-in page**

Create `apps/web/src/app/sign-in/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main>
      <h1>Sign in to Planr</h1>
      <form onSubmit={onSubmit}>
        <input
          aria-label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          aria-label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign in</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <p>
        No account? <a href="/sign-up">Sign up</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Sign-out button**

Create `apps/web/src/components/sign-out-button.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  async function onClick() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }
  return (
    <button type="button" onClick={onClick}>
      Sign out
    </button>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

Run `pnpm --filter @planr/web typecheck; echo "tc=$?"` → 0. Commit:
```bash
git add apps/web/src/app/sign-up apps/web/src/app/sign-in apps/web/src/components
git commit -m "feat(web): Supabase email/password sign-up, sign-in, and sign-out

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Server caller + dashboard (organizations)

**Files:** Create `apps/web/src/server/caller.ts`, `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/dashboard/actions.ts`.

- [ ] **Step 1: Per-request authed tRPC caller**

Create `apps/web/src/server/caller.ts`:
```ts
import { appRouter } from "./routers/app";
import { makeContext } from "./trpc";
import { getCurrentUser } from "./auth";

/** An authed tRPC caller bound to the current request's user (or null). */
export async function getServerCaller() {
  return appRouter.createCaller(makeContext(await getCurrentUser()));
}
```

- [ ] **Step 2: Server actions for org/event creation**

Create `apps/web/src/app/dashboard/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../server/caller";

export async function createOrgAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await (await getServerCaller()).organizations.create({ name });
  revalidatePath("/dashboard");
}

export async function createEventAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const eventTypeKey = String(formData.get("eventTypeKey") ?? "wedding") as
    | "wedding"
    | "birthday"
    | "funeral"
    | "bridal_shower"
    | "corporate";
  if (!organizationId || !name) return;
  await (await getServerCaller()).events.create({ organizationId, eventTypeKey, name });
  revalidatePath(`/dashboard/org/${organizationId}`);
}
```

- [ ] **Step 3: Dashboard page**

Create `apps/web/src/app/dashboard/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../server/auth";
import { getServerCaller } from "../../server/caller";
import { createOrgAction } from "./actions";
import { SignOutButton } from "../../components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const orgs = await (await getServerCaller()).organizations.list();

  return (
    <main>
      <header>
        <h1>Dashboard</h1>
        <span>{user.email ?? "(no email)"}</span>
        <SignOutButton />
      </header>

      <section>
        <h2>Create an organization</h2>
        <form action={createOrgAction}>
          <input aria-label="Organization name" name="name" required />
          <button type="submit">Create organization</button>
        </form>
      </section>

      <section>
        <h2>Your organizations ({orgs.length})</h2>
        <ul>
          {orgs.map((o) => (
            <li key={o.id}>
              <a href={`/dashboard/org/${o.id}`}>{o.name}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

Run `DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null; pnpm --filter @planr/web typecheck; echo "tc=$?"` → 0. Commit:
```bash
git add apps/web/src/server/caller.ts apps/web/src/app/dashboard
git commit -m "feat(web): dashboard with org list + create-org server action

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Org page (events) + event page (modules)

**Files:** Create `apps/web/src/app/dashboard/org/[orgId]/page.tsx`, `apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/page.tsx`.

- [ ] **Step 1: Org page — events list + create-event form**

Create `apps/web/src/app/dashboard/org/[orgId]/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../server/auth";
import { getServerCaller } from "../../../../server/caller";
import { createEventAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function OrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const events = await (await getServerCaller()).events.list({ organizationId: orgId });

  return (
    <main>
      <p>
        <a href="/dashboard">← Dashboard</a>
      </p>
      <h1>Events</h1>

      <section>
        <h2>Create an event</h2>
        <form action={createEventAction}>
          <input type="hidden" name="organizationId" value={orgId} />
          <input aria-label="Event name" name="name" required />
          <select aria-label="Event type" name="eventTypeKey" defaultValue="wedding">
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="funeral">Funeral</option>
            <option value="bridal_shower">Bridal shower</option>
            <option value="corporate">Corporate</option>
          </select>
          <button type="submit">Create event</button>
        </form>
      </section>

      <section>
        <h2>Events ({events.length})</h2>
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              <a href={`/dashboard/org/${orgId}/event/${e.id}`}>
                {e.name} ({e.eventTypeKey})
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Event page — gated module list**

Create `apps/web/src/app/dashboard/org/[orgId]/event/[eventId]/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../server/auth";
import { getServerCaller } from "../../../../../../server/caller";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const modules = await (await getServerCaller()).events.modules({
    organizationId: orgId,
    eventId,
  });

  return (
    <main>
      <p>
        <a href={`/dashboard/org/${orgId}`}>← Events</a>
      </p>
      <h1>Modules</h1>
      <ul>
        {modules.map((m) => (
          <li key={m.module} data-module={m.module} data-locked={m.locked}>
            {m.module} — {m.locked ? `locked (${m.reason})` : "available"}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Typecheck + build + commit**

Run:
```bash
DATABASE_URL='postgresql://dummy@localhost/d' pnpm --filter @planr/db run db:generate >/dev/null
pnpm --filter @planr/web typecheck; echo "tc=$?"
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres' \
  NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54421' \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_x' \
  SUPABASE_SECRET_KEY='sb_secret_x' \
  NEXT_PUBLIC_BASE_URL='http://localhost:3000' \
  pnpm --filter @planr/web exec next build 2>&1 | tail -12
```
Expected: tc=0; build compiles `/dashboard`, `/dashboard/org/[orgId]`, `/dashboard/org/[orgId]/event/[eventId]`. Commit:
```bash
git add apps/web/src/app/dashboard/org
git commit -m "feat(web): org page (events) and event page (gated modules)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Playwright E2E (full slice against local Supabase)

**Files:** Modify `apps/web/package.json`; create `apps/web/playwright.config.ts`, `apps/web/e2e/slice.spec.ts`.

- [ ] **Step 1: Install Playwright + add script**

Run:
```bash
cd /Users/papii/Planr
pnpm --filter @planr/web add -D @playwright/test
pnpm --filter @planr/web exec playwright install chromium
```
Add to `apps/web/package.json` scripts:
```json
    "e2e": "playwright test"
```

- [ ] **Step 2: Playwright config (launches `next dev` with the local Supabase env)**

Create `apps/web/playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54421";
// Local Supabase publishable key (from `supabase status`). Override via env if different.
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "sb_secret_e2e_placeholder_unused";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "pnpm exec next dev -p 3000",
    url: "http://localhost:3000/sign-in",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54422/postgres",
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      SUPABASE_SECRET_KEY: SECRET,
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    },
  },
});
```
> Before running, confirm the publishable/secret keys match this machine: `supabase status | grep -i 'publishable\|secret'`. If they differ, export `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` when invoking the e2e script.

- [ ] **Step 3: The end-to-end slice test**

Create `apps/web/e2e/slice.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("sign up → create org → create wedding event → see gated modules", async ({ page }) => {
  // Unique email per run (no Date.now in app code, but fine in a test file).
  const email = `e2e_${Date.now()}@example.com`;

  // Sign up (local Supabase has email confirmations disabled → immediate session).
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(email)).toBeVisible();

  // Create an organization.
  await page.getByLabel("Organization name").fill("E2E Wedding Co");
  await page.getByRole("button", { name: "Create organization" }).click();
  const orgLink = page.getByRole("link", { name: "E2E Wedding Co" });
  await expect(orgLink).toBeVisible();
  await orgLink.click();

  // Create a wedding event.
  await expect(page).toHaveURL(/\/dashboard\/org\/.+/);
  await page.getByLabel("Event name").fill("Our Wedding");
  await page.getByLabel("Event type").selectOption("wedding");
  await page.getByRole("button", { name: "Create event" }).click();
  const eventLink = page.getByRole("link", { name: /Our Wedding \(wedding\)/ });
  await expect(eventLink).toBeVisible();
  await eventLink.click();

  // Gated modules: guests available (free baseline), seating locked (needs plan).
  await expect(page).toHaveURL(/\/event\/.+/);
  const guests = page.locator('[data-module="guests"]');
  const seating = page.locator('[data-module="seating"]');
  await expect(guests).toHaveAttribute("data-locked", "false");
  await expect(seating).toHaveAttribute("data-locked", "true");
  await expect(seating).toContainText("needs_event_type_plan");
});
```

- [ ] **Step 4: Run the E2E (Supabase must be running)**

Run:
```bash
cd /Users/papii/Planr
# ensure the keys match this machine
supabase status | grep -iE 'publishable|secret' | sed -E 's/(key).*/\1: <present>/'
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$(supabase status -o env 2>/dev/null | grep -i ANON | cut -d= -f2- | tr -d '"')" \
  pnpm --filter @planr/web run e2e 2>&1 | tail -20
```
If `supabase status -o env` does not expose the publishable key, read it from `supabase status` and pass it explicitly. Expected: 1 test passed. (Playwright boots `next dev`, drives Chromium through the full flow.)

- [ ] **Step 5: Ignore Playwright artifacts + commit**

Append to root `.gitignore`:
```
apps/web/playwright-report/
apps/web/test-results/
```
Then commit (do NOT commit `node_modules`, reports, or the browser binaries):
```bash
git add apps/web/playwright.config.ts apps/web/e2e apps/web/package.json pnpm-lock.yaml .gitignore
git commit -m "test(web): Playwright E2E — full sign-up→org→event→gated-modules slice

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review (against the spec)

**Spec coverage:**
- §8 auth (Supabase identity; signup→User sync) → Tasks 2-3 (browser auth) + the existing middleware/getCurrentUser; redirect-protected dashboard (Tasks 4-5).
- §5 tenancy / §7 entitlement gating → Tasks 4-5 (UI lists orgs/events and renders the resolver's module gating) + Task 6 (E2E asserts guests-free / seating-locked).
- Plan 3 carry-over (email collision) → Task 1.
- "First vertical slice with Playwright E2E" (spec §11 Plan-3 line, now realized) → Task 6.

**Deferred (by design):** visual polish/design system (functional UI only — invoke frontend-design later); OAuth/SSO; a CI E2E job (E2E runs locally against the full Supabase stack; wiring the whole stack into CI is a separate follow-up). Billing → Plan 5.

**Placeholder scan:** none — every step has complete code. The Playwright config's default Supabase keys are this machine's local-dev keys (safe, local-only) with an env override documented.

**Type consistency:** `email: string | null` is applied consistently across `UserRecord`, `UserRepository.upsertByAuthUserId`, `AuthUserInput`, the adapter, and `getCurrentUser` (Task 1). Server actions call `getServerCaller()` whose `organizations.create`/`events.create` signatures match the Plan 3 router exactly (`{ name }`, `{ organizationId, eventTypeKey, name }`). `events.modules` returns `{ module, locked, reason }[]` — the event page reads `m.module`/`m.locked`/`m.reason` and the E2E asserts `data-module`/`data-locked`/`reason` text, all consistent. The `eventTypeKey` union in the form/action matches the router's `z.enum([...])`.
```
