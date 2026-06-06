-- Payment tracking: amount paid so far toward the vendor's cost.
ALTER TABLE "Vendor" ADD COLUMN "depositPaidCents" INTEGER NOT NULL DEFAULT 0;
