-- Per-guest meal choice for catering headcounts (set by host or by the guest at RSVP).
ALTER TABLE "Guest" ADD COLUMN "mealChoice" TEXT;
