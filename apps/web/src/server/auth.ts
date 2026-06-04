import { syncAuthUser, type UserRecord } from "@planr/core";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { container } from "./container";

/** Returns the request's signed-in user as our internal User row, or null. */
export async function getCurrentUser(): Promise<UserRecord | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return syncAuthUser(container.repos, {
    authUserId: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.name as string | undefined) ?? null,
  });
}
