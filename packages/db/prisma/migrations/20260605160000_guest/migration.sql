CREATE TYPE "RsvpStatus" AS ENUM ('awaiting', 'coming', 'declined', 'maybe');

CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "groupLabel" TEXT,
    "plusOne" BOOLEAN NOT NULL DEFAULT false,
    "rsvpStatus" "RsvpStatus" NOT NULL DEFAULT 'awaiting',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");
CREATE INDEX "Guest_organizationId_eventId_idx" ON "Guest"("organizationId", "eventId");
CREATE INDEX "Guest_eventId_rsvpStatus_idx" ON "Guest"("eventId", "rsvpStatus");

ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
