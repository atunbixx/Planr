-- CreateTable
CREATE TABLE "EventWebsite" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'classic',
    "headline" TEXT,
    "welcomeMessage" TEXT,
    "story" TEXT,
    "scheduleText" TEXT,
    "travelText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventWebsite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventWebsite_eventId_key" ON "EventWebsite"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventWebsite_slug_key" ON "EventWebsite"("slug");

-- CreateIndex
CREATE INDEX "EventWebsite_organizationId_idx" ON "EventWebsite"("organizationId");

-- AddForeignKey
ALTER TABLE "EventWebsite" ADD CONSTRAINT "EventWebsite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWebsite" ADD CONSTRAINT "EventWebsite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
