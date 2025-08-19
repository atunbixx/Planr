-- Vendor enhancements: optional fields, enum, and indexes

-- Create enum for vendor lifecycle status
CREATE TYPE "VendorStatus" AS ENUM ('inquiry','shortlisted','quoted','booked','contracted','paid');

-- Alter vendors table to add new optional columns
ALTER TABLE "vendors"
  ADD COLUMN "status" "VendorStatus",
  ADD COLUMN "rating" SMALLINT,
  ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "quoteAmount" DECIMAL(10,2),
  ADD COLUMN "bookedDate" TIMESTAMP(3),
  ADD COLUMN "instagramUrl" TEXT,
  ADD COLUMN "logoUrl" TEXT;

-- Helpful indexes for filtering/pagination
CREATE INDEX "vendors_userId_category_idx" ON "vendors"("userId", "category");
CREATE INDEX "vendors_userId_status_idx" ON "vendors"("userId", "status");
CREATE INDEX "vendors_userId_createdAt_idx" ON "vendors"("userId", "createdAt");

