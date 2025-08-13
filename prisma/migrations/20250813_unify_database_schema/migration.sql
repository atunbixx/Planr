-- Unify Database Schema Migration
-- This migration updates all foreign keys from wedding_couples to couples
-- and removes the legacy wedding_couples and wedding_guests tables

-- Step 1: Drop existing foreign key constraints that reference wedding_couples
ALTER TABLE "budget_categories" DROP CONSTRAINT IF EXISTS "budget_categories_couple_id_fkey";
ALTER TABLE "budget_expenses" DROP CONSTRAINT IF EXISTS "budget_expenses_couple_id_fkey";
ALTER TABLE "photos" DROP CONSTRAINT IF EXISTS "photos_couple_id_fkey";
ALTER TABLE "tables" DROP CONSTRAINT IF EXISTS "tables_couple_id_fkey";
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_couple_id_fkey";
ALTER TABLE "activity_feed" DROP CONSTRAINT IF EXISTS "activity_feed_couple_id_fkey";
ALTER TABLE "budget_items" DROP CONSTRAINT IF EXISTS "budget_items_couple_id_fkey";
ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_couple_id_fkey";
ALTER TABLE "couple_collaborators" DROP CONSTRAINT IF EXISTS "couple_collaborators_couple_id_fkey";
ALTER TABLE "couple_vendor_reviews" DROP CONSTRAINT IF EXISTS "couple_vendor_reviews_couple_id_fkey";
ALTER TABLE "couple_vendor_tasks" DROP CONSTRAINT IF EXISTS "couple_vendor_tasks_couple_id_fkey";
ALTER TABLE "couple_vendors" DROP CONSTRAINT IF EXISTS "couple_vendors_couple_id_fkey";
ALTER TABLE "deadline_alerts" DROP CONSTRAINT IF EXISTS "deadline_alerts_couple_id_fkey";
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_couple_id_fkey";
ALTER TABLE "guest_groups" DROP CONSTRAINT IF EXISTS "guest_groups_couple_id_fkey";
ALTER TABLE "inspiration_photos" DROP CONSTRAINT IF EXISTS "inspiration_photos_couple_id_fkey";
ALTER TABLE "milestones" DROP CONSTRAINT IF EXISTS "milestones_couple_id_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_couple_id_fkey";
ALTER TABLE "onboarding_progress" DROP CONSTRAINT IF EXISTS "onboarding_progress_couple_id_fkey";
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_couple_id_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_couple_id_fkey";
ALTER TABLE "timeline_events" DROP CONSTRAINT IF EXISTS "timeline_events_couple_id_fkey";
ALTER TABLE "timeline_items" DROP CONSTRAINT IF EXISTS "timeline_items_couple_id_fkey";
ALTER TABLE "timeline_tasks" DROP CONSTRAINT IF EXISTS "timeline_tasks_couple_id_fkey";
ALTER TABLE "urgent_tasks" DROP CONSTRAINT IF EXISTS "urgent_tasks_couple_id_fkey";
ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_couple_id_fkey";
ALTER TABLE "vendor_favorites" DROP CONSTRAINT IF EXISTS "vendor_favorites_couple_id_fkey";
ALTER TABLE "vendor_inquiries" DROP CONSTRAINT IF EXISTS "vendor_inquiries_couple_id_fkey";
ALTER TABLE "vendor_reviews" DROP CONSTRAINT IF EXISTS "vendor_reviews_couple_id_fkey";
ALTER TABLE "vendor_tasks" DROP CONSTRAINT IF EXISTS "vendor_tasks_couple_id_fkey";
ALTER TABLE "wedding_guests" DROP CONSTRAINT IF EXISTS "guests_couple_id_fkey";

-- Step 2: Add new foreign key constraints that reference couples table
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "budget_expenses" ADD CONSTRAINT "budget_expenses_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "photos" ADD CONSTRAINT "photos_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "tables" ADD CONSTRAINT "tables_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "messages" ADD CONSTRAINT "messages_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "activity_feed" ADD CONSTRAINT "activity_feed_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "couple_collaborators" ADD CONSTRAINT "couple_collaborators_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "couple_vendor_reviews" ADD CONSTRAINT "couple_vendor_reviews_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "couple_vendor_tasks" ADD CONSTRAINT "couple_vendor_tasks_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "couple_vendors" ADD CONSTRAINT "couple_vendors_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "deadline_alerts" ADD CONSTRAINT "deadline_alerts_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "guest_groups" ADD CONSTRAINT "guest_groups_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "inspiration_photos" ADD CONSTRAINT "inspiration_photos_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "timeline_tasks" ADD CONSTRAINT "timeline_tasks_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "urgent_tasks" ADD CONSTRAINT "urgent_tasks_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "vendor_favorites" ADD CONSTRAINT "vendor_favorites_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "vendor_inquiries" ADD CONSTRAINT "vendor_inquiries_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "vendor_tasks" ADD CONSTRAINT "vendor_tasks_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Step 3: Drop the legacy tables
DROP TABLE IF EXISTS "wedding_couples" CASCADE;
DROP TABLE IF EXISTS "wedding_guests" CASCADE;

-- Note: The CASCADE option will automatically drop any remaining constraints or dependencies