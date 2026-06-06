import { defineConfig } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54421";
// Local Supabase keys (from `supabase status`). Override via env if different on this machine.
// The publishable (anon) key is the only Supabase key the slice actually uses
// (client auth + server getUser). It is public by design. Default to the local
// Supabase value; override via env if different on this machine.
const PUBLISHABLE =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
// SUPABASE_SECRET_KEY is required by parseEnv but unused by the E2E, so a dummy
// is fine here (do NOT hardcode a real secret — push protection blocks it).
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "sb_secret_e2e_placeholder_unused";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "pnpm exec next dev -p 3100",
    url: "http://localhost:3100/sign-in",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54422/postgres",
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      SUPABASE_SECRET_KEY: SECRET,
      NEXT_PUBLIC_BASE_URL: "http://localhost:3100",
    },
  },
});
