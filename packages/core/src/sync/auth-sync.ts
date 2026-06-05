import type { Repositories, UserRecord } from "../ports/repositories";

/** Maps a signed-in Supabase auth user to our internal User row (called per request). */
export async function syncAuthUser(
  repos: Repositories,
  input: { authUserId: string; email: string | null; name: string | null },
): Promise<UserRecord> {
  return repos.users.upsertByAuthUserId(input);
}
