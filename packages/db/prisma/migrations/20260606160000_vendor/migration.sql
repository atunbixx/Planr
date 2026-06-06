-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('researching', 'contacted', 'quoted', 'booked', 'declined');

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "category" TEXT,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'researching',
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vendor_eventId_idx" ON "Vendor"("eventId");

-- CreateIndex
CREATE INDEX "Vendor_organizationId_eventId_idx" ON "Vendor"("organizationId", "eventId");

-- CreateIndex
CREATE INDEX "Vendor_eventId_status_idx" ON "Vendor"("eventId", "status");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
