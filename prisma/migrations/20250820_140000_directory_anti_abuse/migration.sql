ALTER TABLE "directory_vendors"
  ADD COLUMN IF NOT EXISTS "websiteHost" TEXT,
  ADD COLUMN IF NOT EXISTS "emailLower" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneDigits" TEXT,
  ADD COLUMN IF NOT EXISTS "fraudFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "duplicateOfId" UUID,
  ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "dirvendors_websitehost_idx" ON "directory_vendors" ("websiteHost");
CREATE INDEX IF NOT EXISTS "dirvendors_emaillower_idx" ON "directory_vendors" ("emailLower");
CREATE INDEX IF NOT EXISTS "dirvendors_phonedigits_idx" ON "directory_vendors" ("phoneDigits");
