-- Add the public RSVP capability token to existing + future guests.
ALTER TABLE "Guest" ADD COLUMN "rsvpToken" TEXT;

-- Backfill existing rows with a distinct unguessable token.
UPDATE "Guest" SET "rsvpToken" = gen_random_uuid()::text WHERE "rsvpToken" IS NULL;

-- Now enforce presence + uniqueness (new rows get an app-supplied uuid via Prisma @default).
ALTER TABLE "Guest" ALTER COLUMN "rsvpToken" SET NOT NULL;
CREATE UNIQUE INDEX "Guest_rsvpToken_key" ON "Guest"("rsvpToken");
