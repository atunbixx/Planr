-- Per-workspace currency (ISO 4217). Existing rows default to GBP.
ALTER TABLE "Organization" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'GBP';
