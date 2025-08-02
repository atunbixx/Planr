-- RSVP Meal Selection Enhancements
-- Advanced meal tracking with course-by-course selections

-- Enhanced meal selections table for detailed tracking
CREATE TABLE IF NOT EXISTS rsvp_meal_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES wedding_guests(id) ON DELETE CASCADE,
    plus_one_guest_id UUID REFERENCES plus_one_guests(id) ON DELETE CASCADE,
    response_id UUID REFERENCES rsvp_responses(id) ON DELETE SET NULL,
    
    -- Ensure either guest_id or plus_one_guest_id is set
    CONSTRAINT check_guest_reference CHECK (
        (guest_id IS NOT NULL AND plus_one_guest_id IS NULL) OR
        (guest_id IS NULL AND plus_one_guest_id IS NOT NULL)
    ),
    
    -- Course selections (references meal_options table)
    cocktail_hour_selection UUID REFERENCES meal_options(id),
    appetizer_selection UUID REFERENCES meal_options(id),
    salad_selection UUID REFERENCES meal_options(id),
    soup_selection UUID REFERENCES meal_options(id),
    main_course_selection UUID REFERENCES meal_options(id),
    dessert_selection UUID REFERENCES meal_options(id),
    
    -- Alternative meal options
    kids_meal_selection UUID REFERENCES meal_options(id),
    vendor_meal_selection UUID REFERENCES meal_options(id),
    
    -- Dietary information
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    is_dairy_free BOOLEAN DEFAULT false,
    is_nut_free BOOLEAN DEFAULT false,
    is_shellfish_free BOOLEAN DEFAULT false,
    is_kosher BOOLEAN DEFAULT false,
    is_halal BOOLEAN DEFAULT false,
    
    -- Specific allergies and restrictions
    food_allergies TEXT[],
    dietary_notes TEXT,
    
    -- Beverage preferences
    alcohol_preference VARCHAR(50) CHECK (alcohol_preference IN ('wine', 'beer', 'cocktails', 'none', 'all')),
    wine_preference VARCHAR(50) CHECK (wine_preference IN ('red', 'white', 'rose', 'all', 'none')),
    non_alcoholic_preferences TEXT[],
    
    -- Special requests
    portion_size VARCHAR(50) DEFAULT 'regular' CHECK (portion_size IN ('small', 'regular', 'large')),
    texture_modifications TEXT, -- for elderly or special needs
    temperature_preferences TEXT,
    seating_accessibility_needs TEXT,
    
    -- Confirmation
    selections_confirmed BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create meal service schedule table
CREATE TABLE IF NOT EXISTS meal_service_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) CHECK (service_type IN ('cocktail_hour', 'dinner', 'late_night', 'brunch')),
    scheduled_time TIME,
    duration_minutes INTEGER,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dietary summary view
CREATE OR REPLACE VIEW rsvp_dietary_summary AS
WITH guest_selections AS (
    SELECT 
        rms.couple_id,
        rms.guest_id,
        rms.plus_one_guest_id,
        CASE 
            WHEN rms.guest_id IS NOT NULL THEN wg.first_name || ' ' || wg.last_name
            ELSE pog.full_name
        END as guest_name,
        CASE 
            WHEN rms.guest_id IS NOT NULL THEN wg.table_assignment
            ELSE pog.table_assignment
        END as table_assignment,
        rms.is_vegetarian,
        rms.is_vegan,
        rms.is_gluten_free,
        rms.is_dairy_free,
        rms.is_nut_free,
        rms.is_shellfish_free,
        rms.is_kosher,
        rms.is_halal,
        rms.food_allergies,
        rms.dietary_notes
    FROM rsvp_meal_selections rms
    LEFT JOIN wedding_guests wg ON rms.guest_id = wg.id
    LEFT JOIN plus_one_guests pog ON rms.plus_one_guest_id = pog.id
)
SELECT 
    couple_id,
    COUNT(*) as total_guests,
    COUNT(CASE WHEN is_vegetarian THEN 1 END) as vegetarian_count,
    COUNT(CASE WHEN is_vegan THEN 1 END) as vegan_count,
    COUNT(CASE WHEN is_gluten_free THEN 1 END) as gluten_free_count,
    COUNT(CASE WHEN is_dairy_free THEN 1 END) as dairy_free_count,
    COUNT(CASE WHEN is_nut_free THEN 1 END) as nut_free_count,
    COUNT(CASE WHEN is_kosher THEN 1 END) as kosher_count,
    COUNT(CASE WHEN is_halal THEN 1 END) as halal_count,
    COUNT(CASE WHEN array_length(food_allergies, 1) > 0 THEN 1 END) as has_allergies_count
FROM guest_selections
GROUP BY couple_id;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rsvp_meal_selections_couple ON rsvp_meal_selections(couple_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_meal_selections_guest ON rsvp_meal_selections(guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_meal_selections_plus_one ON rsvp_meal_selections(plus_one_guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_meal_selections_confirmed ON rsvp_meal_selections(selections_confirmed);
CREATE INDEX IF NOT EXISTS idx_meal_service_schedule_couple ON meal_service_schedule(couple_id);

-- Enable RLS
ALTER TABLE rsvp_meal_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_service_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies for rsvp_meal_selections
CREATE POLICY "Users can view their own meal selections"
    ON rsvp_meal_selections FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can manage meal selections"
    ON rsvp_meal_selections FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for meal_service_schedule
CREATE POLICY "Users can view their own meal schedule"
    ON meal_service_schedule FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can manage meal schedule"
    ON meal_service_schedule FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to save meal selections
CREATE OR REPLACE FUNCTION save_meal_selections(
    p_couple_id UUID,
    p_guest_id UUID DEFAULT NULL,
    p_plus_one_guest_id UUID DEFAULT NULL,
    p_response_id UUID DEFAULT NULL,
    p_main_course UUID DEFAULT NULL,
    p_dietary_flags JSONB DEFAULT '{}'::JSONB,
    p_allergies TEXT[] DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_selection_id UUID;
BEGIN
    -- Check if selection already exists
    SELECT id INTO v_selection_id
    FROM rsvp_meal_selections
    WHERE couple_id = p_couple_id
    AND (
        (guest_id = p_guest_id AND p_guest_id IS NOT NULL) OR
        (plus_one_guest_id = p_plus_one_guest_id AND p_plus_one_guest_id IS NOT NULL)
    );
    
    IF v_selection_id IS NULL THEN
        -- Insert new selection
        INSERT INTO rsvp_meal_selections (
            couple_id,
            guest_id,
            plus_one_guest_id,
            response_id,
            main_course_selection,
            is_vegetarian,
            is_vegan,
            is_gluten_free,
            is_dairy_free,
            is_nut_free,
            is_kosher,
            is_halal,
            food_allergies,
            dietary_notes,
            selections_confirmed
        ) VALUES (
            p_couple_id,
            p_guest_id,
            p_plus_one_guest_id,
            p_response_id,
            p_main_course,
            COALESCE((p_dietary_flags->>'is_vegetarian')::BOOLEAN, false),
            COALESCE((p_dietary_flags->>'is_vegan')::BOOLEAN, false),
            COALESCE((p_dietary_flags->>'is_gluten_free')::BOOLEAN, false),
            COALESCE((p_dietary_flags->>'is_dairy_free')::BOOLEAN, false),
            COALESCE((p_dietary_flags->>'is_nut_free')::BOOLEAN, false),
            COALESCE((p_dietary_flags->>'is_kosher')::BOOLEAN, false),
            COALESCE((p_dietary_flags->>'is_halal')::BOOLEAN, false),
            p_allergies,
            p_notes,
            true
        ) RETURNING id INTO v_selection_id;
    ELSE
        -- Update existing selection
        UPDATE rsvp_meal_selections
        SET 
            main_course_selection = COALESCE(p_main_course, main_course_selection),
            is_vegetarian = COALESCE((p_dietary_flags->>'is_vegetarian')::BOOLEAN, is_vegetarian),
            is_vegan = COALESCE((p_dietary_flags->>'is_vegan')::BOOLEAN, is_vegan),
            is_gluten_free = COALESCE((p_dietary_flags->>'is_gluten_free')::BOOLEAN, is_gluten_free),
            is_dairy_free = COALESCE((p_dietary_flags->>'is_dairy_free')::BOOLEAN, is_dairy_free),
            is_nut_free = COALESCE((p_dietary_flags->>'is_nut_free')::BOOLEAN, is_nut_free),
            is_kosher = COALESCE((p_dietary_flags->>'is_kosher')::BOOLEAN, is_kosher),
            is_halal = COALESCE((p_dietary_flags->>'is_halal')::BOOLEAN, is_halal),
            food_allergies = COALESCE(p_allergies, food_allergies),
            dietary_notes = COALESCE(p_notes, dietary_notes),
            selections_confirmed = true,
            confirmed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_selection_id;
    END IF;
    
    RETURN v_selection_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive meal report
CREATE OR REPLACE FUNCTION get_meal_selection_report(p_couple_id UUID)
RETURNS TABLE (
    report_type VARCHAR(50),
    category VARCHAR(100),
    count INTEGER,
    percentage DECIMAL(5,2),
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Main course selections
    SELECT 
        'main_course'::VARCHAR(50) as report_type,
        mo.name as category,
        COUNT(*)::INTEGER as count,
        (COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0))::DECIMAL(5,2) as percentage,
        STRING_AGG(DISTINCT rms.dietary_notes, '; ') as notes
    FROM rsvp_meal_selections rms
    JOIN meal_options mo ON rms.main_course_selection = mo.id
    WHERE rms.couple_id = p_couple_id
    GROUP BY mo.name
    
    UNION ALL
    
    -- Dietary restrictions summary
    SELECT 
        'dietary_restriction'::VARCHAR(50),
        restriction_type::VARCHAR(100),
        restriction_count::INTEGER,
        (restriction_count * 100.0 / total_guests)::DECIMAL(5,2),
        NULL::TEXT
    FROM (
        SELECT 
            unnest(ARRAY[
                'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
                'Nut-Free', 'Kosher', 'Halal'
            ]) as restriction_type,
            unnest(ARRAY[
                SUM(CASE WHEN is_vegetarian THEN 1 ELSE 0 END),
                SUM(CASE WHEN is_vegan THEN 1 ELSE 0 END),
                SUM(CASE WHEN is_gluten_free THEN 1 ELSE 0 END),
                SUM(CASE WHEN is_dairy_free THEN 1 ELSE 0 END),
                SUM(CASE WHEN is_nut_free THEN 1 ELSE 0 END),
                SUM(CASE WHEN is_kosher THEN 1 ELSE 0 END),
                SUM(CASE WHEN is_halal THEN 1 ELSE 0 END)
            ]) as restriction_count,
            COUNT(*) as total_guests
        FROM rsvp_meal_selections
        WHERE couple_id = p_couple_id
    ) dietary_data
    WHERE restriction_count > 0
    
    ORDER BY report_type, count DESC;
END;
$$ LANGUAGE plpgsql;