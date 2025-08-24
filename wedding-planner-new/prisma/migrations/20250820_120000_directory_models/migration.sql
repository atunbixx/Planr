-- Create table: directory_vendors
CREATE TABLE IF NOT EXISTS "directory_vendors" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerUserId" UUID,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "city" TEXT,
  "region" TEXT,
  "priceBand" TEXT,
  "averageRating" SMALLINT,
  "reviewCount" INTEGER DEFAULT 0,
  "shortDescription" TEXT,
  "description" TEXT,
  "photos" TEXT[] DEFAULT '{}',
  "website" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "tags" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dirvendors_category_region_idx" ON "directory_vendors" ("category", "region");
CREATE INDEX IF NOT EXISTS "dirvendors_rating_reviews_idx" ON "directory_vendors" ("averageRating", "reviewCount");
CREATE INDEX IF NOT EXISTS "dirvendors_owner_idx" ON "directory_vendors" ("ownerUserId");

-- Update trigger to maintain updatedAt
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_directory_vendors_updated_at ON "directory_vendors";
CREATE TRIGGER trg_directory_vendors_updated_at
BEFORE UPDATE ON "directory_vendors"
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Create table: directory_inquiries
CREATE TABLE IF NOT EXISTS "directory_inquiries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendorId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT NOT NULL,
  "eventDate" TIMESTAMPTZ,
  "budget" DECIMAL(10,2),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_inquiry_vendor FOREIGN KEY ("vendorId") REFERENCES "directory_vendors"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "dirinquiries_vendor_created_idx" ON "directory_inquiries" ("vendorId", "createdAt");

DROP TRIGGER IF EXISTS trg_directory_inquiries_updated_at ON "directory_inquiries";
CREATE TRIGGER trg_directory_inquiries_updated_at
BEFORE UPDATE ON "directory_inquiries"
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

