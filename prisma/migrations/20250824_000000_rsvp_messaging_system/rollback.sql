-- Rollback script for RSVP and messaging system migration
-- Run this script to undo the changes if needed

-- Drop foreign key constraints first
ALTER TABLE "invite_rsvps" DROP CONSTRAINT IF EXISTS "invite_rsvps_invite_id_fkey";
ALTER TABLE "invite_rsvps" DROP CONSTRAINT IF EXISTS "invite_rsvps_user_id_fkey";
ALTER TABLE "invites" DROP CONSTRAINT IF EXISTS "invites_user_id_fkey";
ALTER TABLE "credit_balances" DROP CONSTRAINT IF EXISTS "credit_balances_user_id_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "vendors_slug_idx";
DROP INDEX IF EXISTS "vendors_slug_key";
DROP INDEX IF EXISTS "invite_rsvps_invite_idx";
DROP INDEX IF EXISTS "invite_rsvps_user_idx";
DROP INDEX IF EXISTS "invite_rsvps_user_email_unique";
DROP INDEX IF EXISTS "invites_token_idx";
DROP INDEX IF EXISTS "invites_user_idx";
DROP INDEX IF EXISTS "invites_token_key";

-- Remove slug column from vendors table
ALTER TABLE "vendors" DROP COLUMN IF EXISTS "slug";

-- Drop tables
DROP TABLE IF EXISTS "credit_balances";
DROP TABLE IF EXISTS "invite_rsvps";
DROP TABLE IF EXISTS "invites";

-- Note: This rollback will permanently delete all RSVP and messaging data
-- Make sure to backup data before running this script