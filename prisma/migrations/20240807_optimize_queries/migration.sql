-- Add missing indexes for query optimization

-- Index for couples.user_id (frequently used in queries)
CREATE INDEX IF NOT EXISTS idx_couples_user_id ON couples(user_id);

-- Index for guests.attending_status (used in stats calculations)
CREATE INDEX IF NOT EXISTS idx_guests_attending_status ON guests(attending_status);

-- Composite index for guests couple_id and attending_status
CREATE INDEX IF NOT EXISTS idx_guests_couple_attending ON guests(couple_id, attending_status);

-- Index for vendors.couple_id and status (if not already exists)
CREATE INDEX IF NOT EXISTS idx_vendors_couple_status ON vendors(couple_id, status);

-- Index for expenses.couple_id (for budget calculations)
CREATE INDEX IF NOT EXISTS idx_expenses_couple_id ON expenses(couple_id);

-- Index for photos.couple_id (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_photos_couple_id ON photos(couple_id);

-- Add performance helper functions
CREATE OR REPLACE FUNCTION get_guest_stats(p_couple_id UUID)
RETURNS TABLE(
  total INTEGER,
  confirmed INTEGER,
  declined INTEGER,
  pending INTEGER,
  with_plus_one INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE attending_status = 'yes')::INTEGER as confirmed,
    COUNT(*) FILTER (WHERE attending_status = 'no')::INTEGER as declined,
    COUNT(*) FILTER (WHERE attending_status IS NULL OR attending_status = 'pending')::INTEGER as pending,
    COUNT(*) FILTER (WHERE plus_one_allowed = true)::INTEGER as with_plus_one
  FROM guests
  WHERE couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_vendor_stats(p_couple_id UUID)
RETURNS TABLE(
  total INTEGER,
  booked INTEGER,
  pending INTEGER,
  contacted INTEGER,
  potential INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE status = 'booked')::INTEGER as booked,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending,
    COUNT(*) FILTER (WHERE status = 'contacted')::INTEGER as contacted,
    COUNT(*) FILTER (WHERE status = 'potential')::INTEGER as potential
  FROM vendors
  WHERE couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment to track optimization
COMMENT ON INDEX idx_couples_user_id IS 'Optimization: Speeds up user-to-couple lookups';
COMMENT ON INDEX idx_guests_attending_status IS 'Optimization: Speeds up guest statistics calculations';
COMMENT ON INDEX idx_guests_couple_attending IS 'Optimization: Speeds up guest list queries with status filtering';