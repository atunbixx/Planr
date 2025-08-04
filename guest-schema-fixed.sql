-- Guest Management Tables (FIXED VERSION)
-- Run this in Supabase SQL Editor AFTER running fix-couples-schema.sql

-- Guests table to store individual guest information
CREATE TABLE IF NOT EXISTS guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    relationship VARCHAR(50), -- friend, family, colleague, etc.
    side VARCHAR(10) CHECK (side IN ('bride', 'groom', 'both')), -- which side of the couple
    plus_one_allowed BOOLEAN DEFAULT false,
    plus_one_name VARCHAR(200),
    dietary_restrictions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitations table to track RSVP status
CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    invitation_code VARCHAR(50) UNIQUE, -- unique code for RSVP tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'no_response')),
    attending_count INTEGER DEFAULT 0, -- how many will attend (guest + plus one)
    plus_one_attending BOOLEAN,
    plus_one_name VARCHAR(200), -- name of plus one if different from guest record
    dietary_restrictions TEXT, -- updated dietary restrictions from RSVP
    rsvp_notes TEXT, -- notes from the guest
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    rsvp_deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest groups table for organizing guests (optional)
CREATE TABLE IF NOT EXISTS guest_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "College Friends", "Family", "Work Colleagues"
    description TEXT,
    color VARCHAR(7), -- hex color for visual grouping
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for guest group memberships
CREATE TABLE IF NOT EXISTS guest_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guest_id, group_id)
);

-- Enable Row Level Security
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_group_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their couple's guests" ON guests;
DROP POLICY IF EXISTS "Users can insert guests for their couple" ON guests;
DROP POLICY IF EXISTS "Users can update their couple's guests" ON guests;
DROP POLICY IF EXISTS "Users can delete their couple's guests" ON guests;

DROP POLICY IF EXISTS "Users can view their couple's invitations" ON invitations;
DROP POLICY IF EXISTS "Users can insert invitations for their couple" ON invitations;
DROP POLICY IF EXISTS "Users can update their couple's invitations" ON invitations;

DROP POLICY IF EXISTS "Users can manage their couple's guest groups" ON guest_groups;
DROP POLICY IF EXISTS "Users can manage their guest group memberships" ON guest_group_members;

-- FIXED RLS Policies for guests (simplified to avoid partner_id issues)
CREATE POLICY "Users can view their couple's guests" ON guests
    FOR SELECT USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert guests for their couple" ON guests
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their couple's guests" ON guests
    FOR UPDATE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete their couple's guests" ON guests
    FOR DELETE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- FIXED RLS Policies for invitations
CREATE POLICY "Users can view their couple's invitations" ON invitations
    FOR SELECT USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert invitations for their couple" ON invitations
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their couple's invitations" ON invitations
    FOR UPDATE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- FIXED RLS Policies for guest_groups
CREATE POLICY "Users can manage their couple's guest groups" ON guest_groups
    FOR ALL USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- FIXED RLS Policies for guest_group_members
CREATE POLICY "Users can manage their guest group memberships" ON guest_group_members
    FOR ALL USING (
        guest_id IN (
            SELECT guests.id FROM guests
            JOIN couples ON couples.id = guests.couple_id
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
DROP TRIGGER IF EXISTS update_guest_groups_updated_at ON guest_groups;

-- Create new triggers
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_groups_updated_at BEFORE UPDATE ON guest_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to generate unique invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3) || '-' ||
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3) || '-' ||
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get guest statistics for a couple
CREATE OR REPLACE FUNCTION get_guest_stats(p_couple_id UUID)
RETURNS TABLE(
    total_invited INTEGER,
    total_confirmed INTEGER,
    total_declined INTEGER,
    total_pending INTEGER,
    total_attending INTEGER,
    response_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_invited,
        COUNT(CASE WHEN i.status = 'confirmed' THEN 1 END)::INTEGER as total_confirmed,
        COUNT(CASE WHEN i.status = 'declined' THEN 1 END)::INTEGER as total_declined,
        COUNT(CASE WHEN i.status IN ('pending', 'no_response') THEN 1 END)::INTEGER as total_pending,
        COALESCE(SUM(CASE WHEN i.status = 'confirmed' THEN i.attending_count ELSE 0 END), 0)::INTEGER as total_attending,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(
                    (COUNT(CASE WHEN i.status IN ('confirmed', 'declined') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100,
                    1
                )
            ELSE 0
        END as response_rate
    FROM guests g
    LEFT JOIN invitations i ON i.guest_id = g.id
    WHERE g.couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql;

-- Verify tables were created successfully
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_name IN ('guests', 'invitations', 'guest_groups', 'guest_group_members')
    AND t.table_schema = 'public'
ORDER BY t.table_name;