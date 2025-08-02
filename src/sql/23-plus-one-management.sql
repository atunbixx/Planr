-- Plus-One Management Tables
-- Enhanced tracking for guest plus-ones with detailed information
CREATE TABLE IF NOT EXISTS plus_one_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    primary_guest_id UUID NOT NULL REFERENCES wedding_guests(id) ON DELETE CASCADE,
    response_id UUID REFERENCES rsvp_responses(id) ON DELETE SET NULL,
    
    -- Plus one details
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    relationship_to_guest VARCHAR(100), -- spouse, partner, friend, family, etc.
    
    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Attendance and preferences
    attendance_status VARCHAR(50) DEFAULT 'pending' CHECK (attendance_status IN ('attending', 'not_attending', 'maybe', 'pending')),
    meal_preference VARCHAR(100),
    dietary_restrictions TEXT,
    dietary_allergies TEXT[],
    
    -- Seating and logistics
    table_assignment VARCHAR(100),
    needs_transportation BOOLEAN DEFAULT false,
    needs_accommodation BOOLEAN DEFAULT false,
    
    -- Child information (if applicable)
    is_child BOOLEAN DEFAULT false,
    age INTEGER,
    requires_high_chair BOOLEAN DEFAULT false,
    requires_kids_meal BOOLEAN DEFAULT false,
    
    -- Metadata
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create plus-one rules table for managing plus-one policies
CREATE TABLE IF NOT EXISTS plus_one_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('all_guests', 'married_only', 'long_term_only', 'named_only', 'custom', 'none')),
    
    -- Rule conditions
    allow_unnamed_guests BOOLEAN DEFAULT false,
    require_relationship_duration INTEGER, -- months
    allowed_relationships TEXT[], -- ['spouse', 'partner', 'fiancé']
    max_plus_ones_per_guest INTEGER DEFAULT 1,
    
    -- Guest categories this rule applies to
    applies_to_categories TEXT[], -- ['family', 'friends', 'coworkers']
    applies_to_sides VARCHAR(50) CHECK (applies_to_sides IN ('both', 'partner1', 'partner2')),
    
    -- Additional settings
    require_advance_notice BOOLEAN DEFAULT true,
    notice_days INTEGER DEFAULT 30,
    allow_children BOOLEAN DEFAULT true,
    children_count_as_plus_one BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plus_one_guests_couple ON plus_one_guests(couple_id);
CREATE INDEX IF NOT EXISTS idx_plus_one_guests_primary ON plus_one_guests(primary_guest_id);
CREATE INDEX IF NOT EXISTS idx_plus_one_guests_response ON plus_one_guests(response_id);
CREATE INDEX IF NOT EXISTS idx_plus_one_guests_status ON plus_one_guests(attendance_status);
CREATE INDEX IF NOT EXISTS idx_plus_one_rules_couple ON plus_one_rules(couple_id);

-- Enable RLS
ALTER TABLE plus_one_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE plus_one_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for plus_one_guests
CREATE POLICY "Users can view their own plus-one guests"
    ON plus_one_guests FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their plus-one guests"
    ON plus_one_guests FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for plus_one_rules
CREATE POLICY "Users can view their own plus-one rules"
    ON plus_one_rules FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their plus-one rules"
    ON plus_one_rules FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to add or update plus-one guest
CREATE OR REPLACE FUNCTION upsert_plus_one_guest(
    p_primary_guest_id UUID,
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_relationship VARCHAR(100) DEFAULT NULL,
    p_meal_preference VARCHAR(100) DEFAULT NULL,
    p_dietary_restrictions TEXT DEFAULT NULL,
    p_is_child BOOLEAN DEFAULT false,
    p_age INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_plus_one_id UUID;
    v_couple_id UUID;
BEGIN
    -- Get couple_id from primary guest
    SELECT couple_id INTO v_couple_id
    FROM wedding_guests
    WHERE id = p_primary_guest_id;
    
    -- Check if plus-one already exists
    SELECT id INTO v_plus_one_id
    FROM plus_one_guests
    WHERE primary_guest_id = p_primary_guest_id
    AND first_name = p_first_name
    AND last_name = p_last_name;
    
    IF v_plus_one_id IS NULL THEN
        -- Insert new plus-one
        INSERT INTO plus_one_guests (
            couple_id,
            primary_guest_id,
            first_name,
            last_name,
            relationship_to_guest,
            meal_preference,
            dietary_restrictions,
            is_child,
            age,
            attendance_status
        ) VALUES (
            v_couple_id,
            p_primary_guest_id,
            p_first_name,
            p_last_name,
            p_relationship,
            p_meal_preference,
            p_dietary_restrictions,
            p_is_child,
            p_age,
            'attending'
        ) RETURNING id INTO v_plus_one_id;
    ELSE
        -- Update existing plus-one
        UPDATE plus_one_guests
        SET 
            relationship_to_guest = COALESCE(p_relationship, relationship_to_guest),
            meal_preference = COALESCE(p_meal_preference, meal_preference),
            dietary_restrictions = COALESCE(p_dietary_restrictions, dietary_restrictions),
            is_child = p_is_child,
            age = p_age,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_plus_one_id;
    END IF;
    
    RETURN v_plus_one_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get plus-one statistics
CREATE OR REPLACE FUNCTION get_plus_one_statistics(p_couple_id UUID)
RETURNS TABLE (
    total_plus_ones INTEGER,
    confirmed_plus_ones INTEGER,
    adult_plus_ones INTEGER,
    child_plus_ones INTEGER,
    plus_one_meal_counts JSONB,
    relationship_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_plus_ones,
        COUNT(CASE WHEN attendance_status = 'attending' THEN 1 END)::INTEGER as confirmed_plus_ones,
        COUNT(CASE WHEN NOT is_child OR is_child IS NULL THEN 1 END)::INTEGER as adult_plus_ones,
        COUNT(CASE WHEN is_child = true THEN 1 END)::INTEGER as child_plus_ones,
        jsonb_object_agg(
            COALESCE(meal_preference, 'Not specified'),
            meal_count
        ) FILTER (WHERE meal_preference IS NOT NULL) as plus_one_meal_counts,
        jsonb_object_agg(
            COALESCE(relationship_to_guest, 'Not specified'),
            relationship_count
        ) as relationship_breakdown
    FROM (
        SELECT 
            meal_preference,
            relationship_to_guest,
            is_child,
            attendance_status,
            COUNT(*) OVER (PARTITION BY meal_preference) as meal_count,
            COUNT(*) OVER (PARTITION BY relationship_to_guest) as relationship_count
        FROM plus_one_guests
        WHERE couple_id = p_couple_id
    ) grouped_data
    WHERE couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate plus-one eligibility
CREATE OR REPLACE FUNCTION check_plus_one_eligibility(
    p_guest_id UUID,
    p_relationship VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    is_eligible BOOLEAN,
    reason TEXT,
    max_allowed INTEGER
) AS $$
DECLARE
    v_guest wedding_guests%ROWTYPE;
    v_rule plus_one_rules%ROWTYPE;
    v_current_plus_ones INTEGER;
BEGIN
    -- Get guest details
    SELECT * INTO v_guest
    FROM wedding_guests
    WHERE id = p_guest_id;
    
    -- Get applicable rule
    SELECT * INTO v_rule
    FROM plus_one_rules
    WHERE couple_id = v_guest.couple_id
    AND is_active = true
    AND (
        applies_to_categories IS NULL 
        OR v_guest.guest_category = ANY(applies_to_categories)
    )
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Count current plus-ones
    SELECT COUNT(*) INTO v_current_plus_ones
    FROM plus_one_guests
    WHERE primary_guest_id = p_guest_id;
    
    -- Check eligibility based on rules
    IF NOT v_guest.plus_one_allowed THEN
        RETURN QUERY SELECT false, 'Plus-one not allowed for this guest', 0;
    ELSIF v_rule.id IS NULL THEN
        RETURN QUERY SELECT true, 'No specific rules apply', 1;
    ELSIF v_current_plus_ones >= COALESCE(v_rule.max_plus_ones_per_guest, 1) THEN
        RETURN QUERY SELECT false, 'Maximum plus-ones reached', v_rule.max_plus_ones_per_guest;
    ELSIF v_rule.rule_type = 'named_only' AND p_relationship IS NULL THEN
        RETURN QUERY SELECT false, 'Named plus-ones only', v_rule.max_plus_ones_per_guest;
    ELSIF v_rule.allowed_relationships IS NOT NULL 
        AND p_relationship IS NOT NULL 
        AND NOT (p_relationship = ANY(v_rule.allowed_relationships)) THEN
        RETURN QUERY SELECT false, 'Relationship type not allowed', v_rule.max_plus_ones_per_guest;
    ELSE
        RETURN QUERY SELECT true, 'Eligible for plus-one', v_rule.max_plus_ones_per_guest;
    END IF;
END;
$$ LANGUAGE plpgsql;