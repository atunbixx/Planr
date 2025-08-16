-- Guest Schema Migration: Fix defaults and constraints
-- This migration ensures consistent guest creation across legacy and enterprise formats

-- 1. Set default RSVP status to 'pending' and make it NOT NULL
ALTER TABLE guests 
ALTER COLUMN rsvp_status SET DEFAULT 'pending',
ALTER COLUMN rsvp_status SET NOT NULL;

-- 2. Ensure relationship is NOT NULL and has proper constraints
ALTER TABLE guests 
ALTER COLUMN relationship SET NOT NULL,
ADD CONSTRAINT check_relationship_length CHECK (char_length(relationship) >= 1 AND char_length(relationship) <= 100);

-- 3. Add has_plus_one column if it doesn't exist (enterprise format)
-- This will be used alongside plus_one_allowed for compatibility
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='guests' AND column_name='has_plus_one') THEN
        ALTER TABLE guests ADD COLUMN has_plus_one BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Ensure has_plus_one and plus_one_allowed stay in sync
CREATE OR REPLACE FUNCTION sync_plus_one_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure both fields have the same value
    IF NEW.has_plus_one IS NULL THEN
        NEW.has_plus_one = COALESCE(NEW.plus_one_allowed, false);
    END IF;
    
    IF NEW.plus_one_allowed IS NULL THEN
        NEW.plus_one_allowed = COALESCE(NEW.has_plus_one, false);
    END IF;
    
    -- Sync the values
    NEW.has_plus_one = COALESCE(NEW.has_plus_one, NEW.plus_one_allowed, false);
    NEW.plus_one_allowed = NEW.has_plus_one;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to sync plus_one fields
DROP TRIGGER IF EXISTS trigger_sync_plus_one ON guests;
CREATE TRIGGER trigger_sync_plus_one
    BEFORE INSERT OR UPDATE ON guests
    FOR EACH ROW
    EXECUTE FUNCTION sync_plus_one_fields();

-- 6. Update existing records to have proper defaults
UPDATE guests 
SET rsvp_status = 'pending' 
WHERE rsvp_status IS NULL;

UPDATE guests 
SET relationship = 'friend' 
WHERE relationship IS NULL OR relationship = '';

-- 7. Ensure name field is populated from first_name/last_name if empty
UPDATE guests 
SET name = COALESCE(
    NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''),
    name,
    'Guest'
)
WHERE name IS NULL OR name = '';

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_relationship ON guests(relationship);
CREATE INDEX IF NOT EXISTS idx_guests_has_plus_one ON guests(has_plus_one);

-- 9. Add comment for future reference
COMMENT ON TABLE guests IS 'Unified guest table supporting both legacy (first_name/last_name) and enterprise (name) formats';
COMMENT ON COLUMN guests.rsvp_status IS 'Default: pending, Required field';
COMMENT ON COLUMN guests.relationship IS 'Required field describing guest relationship to couple';
COMMENT ON COLUMN guests.has_plus_one IS 'Enterprise format: boolean indicating if guest can bring a plus one';
COMMENT ON COLUMN guests.plus_one_allowed IS 'Legacy format: boolean indicating if guest can bring a plus one (kept for compatibility)';

-- 10. Verify migration completion
SELECT 
    COUNT(*) as total_guests,
    COUNT(CASE WHEN rsvp_status = 'pending' THEN 1 END) as pending_rsvp,
    COUNT(CASE WHEN relationship IS NOT NULL AND relationship != '' THEN 1 END) as valid_relationships,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as valid_names
FROM guests;