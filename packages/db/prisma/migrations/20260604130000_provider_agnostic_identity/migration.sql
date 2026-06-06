-- Provider-agnostic identity: drop Clerk-specific columns now that auth is Supabase.

-- Organization: orgs are app-created; drop the external provider id.
DROP INDEX "Organization_clerkOrgId_key";
ALTER TABLE "Organization" DROP COLUMN "clerkOrgId";

-- User: rename clerkUserId -> authUserId (holds the Supabase auth user UUID).
ALTER TABLE "User" RENAME COLUMN "clerkUserId" TO "authUserId";
ALTER INDEX "User_clerkUserId_key" RENAME TO "User_authUserId_key";
