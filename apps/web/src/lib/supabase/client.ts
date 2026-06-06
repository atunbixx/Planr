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
