-- Enhanced guest meal preferences and dietary requirements
-- Adds comprehensive meal tracking for wedding guests

-- Add meal preference columns to wedding_guests
ALTER TABLE wedding_guests 
ADD COLUMN IF NOT EXISTS meal_preference VARCHAR(50) DEFAULT 'standard' 
    CHECK (meal_preference IN ('standard', 'vegetarian', 'vegan', 'pescatarian', 'gluten_free', 'kids_meal', 'vendor_meal', 'no_meal')),
ADD COLUMN IF NOT EXISTS dietary_allergies TEXT[],
ADD COLUMN IF NOT EXISTS meal_notes TEXT,
ADD COLUMN IF NOT EXISTS table_assignment VARCHAR(100);

-- Create meal options table for the wedding
CREATE TABLE IF NOT EXISTS meal_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('standard', 'vegetarian', 'vegan', 'pescatarian', 'gluten_free', 'kids_meal', 'vendor_meal')),
    course_type VARCHAR(50) NOT NULL CHECK (course_type IN ('appetizer', 'main', 'dessert', 'kids')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT[],
    allergen_info TEXT[],
    price_per_plate DECIMAL(10, 2),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create guest meal selections table
CREATE TABLE IF NOT EXISTS guest_meal_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL REFERENCES wedding_guests(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    appetizer_id UUID REFERENCES meal_options(id),
    main_course_id UUID REFERENCES meal_options(id),
    dessert_id UUID REFERENCES meal_options(id),
    special_requests TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guest_id, couple_id)
);

-- Create dietary statistics view
CREATE OR REPLACE VIEW dietary_statistics AS
SELECT 
    couple_id,
    COUNT(*) as total_guests,
    COUNT(CASE WHEN meal_preference = 'vegetarian' THEN 1 END) as vegetarian_count,
    COUNT(CASE WHEN meal_preference = 'vegan' THEN 1 END) as vegan_count,
    COUNT(CASE WHEN meal_preference = 'pescatarian' THEN 1 END) as pescatarian_count,
    COUNT(CASE WHEN meal_preference = 'gluten_free' THEN 1 END) as gluten_free_count,
    COUNT(CASE WHEN meal_preference = 'kids_meal' THEN 1 END) as kids_meal_count,
    COUNT(CASE WHEN dietary_restrictions IS NOT NULL AND dietary_restrictions != '' THEN 1 END) as has_dietary_restrictions,
    COUNT(CASE WHEN dietary_allergies IS NOT NULL AND array_length(dietary_allergies, 1) > 0 THEN 1 END) as has_allergies
FROM wedding_guests
WHERE rsvp_status = 'attending'
GROUP BY couple_id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wedding_guests_meal_preference ON wedding_guests(meal_preference);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_table_assignment ON wedding_guests(table_assignment);
CREATE INDEX IF NOT EXISTS idx_meal_options_couple ON meal_options(couple_id);
CREATE INDEX IF NOT EXISTS idx_guest_meal_selections_guest ON guest_meal_selections(guest_id);

-- Enable RLS for new tables
ALTER TABLE meal_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_meal_selections ENABLE ROW LEVEL SECURITY;

-- RLS policies for meal_options
CREATE POLICY "Users can view their own meal options"
    ON meal_options FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can create meal options"
    ON meal_options FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own meal options"
    ON meal_options FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own meal options"
    ON meal_options FOR DELETE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for guest_meal_selections
CREATE POLICY "Users can view their own guest meal selections"
    ON guest_meal_selections FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can create guest meal selections"
    ON guest_meal_selections FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own guest meal selections"
    ON guest_meal_selections FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to get meal summary for catering
CREATE OR REPLACE FUNCTION get_meal_summary(p_couple_id UUID)
RETURNS TABLE (
    meal_type VARCHAR(50),
    meal_count BIGINT,
    percentage DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH attending_guests AS (
        SELECT meal_preference
        FROM wedding_guests
        WHERE couple_id = p_couple_id
        AND rsvp_status = 'attending'
    ),
    total_count AS (
        SELECT COUNT(*) as total FROM attending_guests
    )
    SELECT 
        ag.meal_preference as meal_type,
        COUNT(*) as meal_count,
        CASE 
            WHEN tc.total > 0 THEN (COUNT(*)::DECIMAL / tc.total * 100)::DECIMAL(5, 2)
            ELSE 0
        END as percentage
    FROM attending_guests ag, total_count tc
    GROUP BY ag.meal_preference, tc.total
    ORDER BY meal_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get allergy summary
CREATE OR REPLACE FUNCTION get_allergy_summary(p_couple_id UUID)
RETURNS TABLE (
    allergy TEXT,
    guest_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(dietary_allergies) as allergy,
        COUNT(DISTINCT id) as guest_count
    FROM wedding_guests
    WHERE couple_id = p_couple_id
    AND rsvp_status = 'attending'
    AND dietary_allergies IS NOT NULL
    GROUP BY allergy
    ORDER BY guest_count DESC;
END;
$$ LANGUAGE plpgsql;