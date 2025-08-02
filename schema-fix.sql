-- Add missing columns for frontend compatibility
ALTER TABLE couples ADD COLUMN IF NOT EXISTS guest_count_estimate INTEGER;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_name TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_location TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_total NUMERIC;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_style TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Copy data from existing columns where possible
UPDATE couples SET 
  guest_count_estimate = COALESCE(guest_count_estimate, estimated_guests, 100),
  venue_name = COALESCE(venue_name, venue),
  budget_total = COALESCE(budget_total, total_budget, 30000),
  wedding_style = COALESCE(wedding_style, planning_style, 'traditional'),
  onboarding_completed = COALESCE(onboarding_completed, true)
WHERE guest_count_estimate IS NULL OR venue_name IS NULL OR budget_total IS NULL OR wedding_style IS NULL OR onboarding_completed IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_couples_guest_count_estimate ON couples(guest_count_estimate);
CREATE INDEX IF NOT EXISTS idx_couples_venue_name ON couples(venue_name);
CREATE INDEX IF NOT EXISTS idx_couples_budget_total ON couples(budget_total);