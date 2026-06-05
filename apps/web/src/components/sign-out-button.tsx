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
