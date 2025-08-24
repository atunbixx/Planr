-- Guest enhancements: plus-one, household, tags (all optional)

ALTER TABLE "guests"
  ADD COLUMN IF NOT EXISTS "plusOneAllowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "plusOneName" TEXT,
  ADD COLUMN IF NOT EXISTS "householdId" TEXT,
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}';

