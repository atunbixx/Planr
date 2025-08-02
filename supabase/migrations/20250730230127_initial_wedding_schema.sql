-- =============================================
-- COMPREHENSIVE WEDDING PLANNER DATABASE SCHEMA
-- Schema-first approach with real data from day 1
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE ENTITIES
-- =============================================

-- Couples table (core entity linking to auth.users)
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner1_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner2_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    partner1_name VARCHAR(100) NOT NULL,
    partner2_name VARCHAR(100),
    wedding_date DATE,
    venue_name VARCHAR(200),
    venue_location VARCHAR(200),
    guest_count_estimate INTEGER DEFAULT 100,
    budget_total DECIMAL(10,2) DEFAULT 50000.00,
    currency VARCHAR(3) DEFAULT 'USD',
    wedding_style VARCHAR(50) DEFAULT 'traditional',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VENDOR MANAGEMENT
-- =============================================

-- Vendor categories enum
CREATE TYPE vendor_category AS ENUM (
    'venue', 'catering', 'photography', 'videography', 'florist', 
    'music_dj', 'band', 'transportation', 'beauty', 'attire', 
    'jewelry', 'invitations', 'decoration', 'lighting', 'rentals', 
    'officiant', 'planner', 'cake', 'entertainment', 'security', 
    'insurance', 'other'
);

-- Vendor status workflow
CREATE TYPE vendor_status AS ENUM (
    'researching', 'contacted', 'meeting_scheduled', 
    'proposal_received', 'quoted', 'booked', 'confirmed', 'cancelled'
);

-- Vendors table
CREATE TABLE couple_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    business_name VARCHAR(200),
    category vendor_category NOT NULL,
    status vendor_status DEFAULT 'researching',
    
    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    contact_person VARCHAR(100),
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Financial
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_due_date DATE,
    final_payment_due DATE,
    
    -- Contract & Status
    contract_signed BOOLEAN DEFAULT FALSE,
    insurance_verified BOOLEAN DEFAULT FALSE,
    availability_confirmed BOOLEAN DEFAULT FALSE,
    
    -- Reviews & Notes
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    referral_source VARCHAR(200),
    
    -- Meeting & Proposal Details
    meeting_date DATE,
    meeting_notes TEXT,
    proposal_details TEXT,
    contract_terms TEXT,
    cancellation_policy TEXT,
    
    -- Business Details
    service_radius_miles INTEGER DEFAULT 50,
    booking_lead_time_days INTEGER DEFAULT 30,
    requires_deposit BOOLEAN DEFAULT TRUE,
    deposit_percentage INTEGER DEFAULT 25,
    
    -- Performance Metrics
    total_bookings INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    response_rate INTEGER DEFAULT 100,
    response_time_hours INTEGER DEFAULT 24,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GUEST MANAGEMENT
-- =============================================

-- Guest categories
CREATE TYPE guest_category AS ENUM (
    'family', 'friends', 'work', 'plus_ones', 'vendors', 'children'
);

-- RSVP status
CREATE TYPE rsvp_status AS ENUM (
    'pending', 'accepted', 'declined', 'tentative'
);

-- Guest side (bride/groom)
CREATE TYPE guest_side AS ENUM (
    'partner1', 'partner2', 'both'
);

-- Guests table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Wedding Details
    category guest_category DEFAULT 'friends',
    side guest_side DEFAULT 'both',
    rsvp_status rsvp_status DEFAULT 'pending',
    plus_one_invited BOOLEAN DEFAULT FALSE,
    plus_one_name VARCHAR(200),
    plus_one_rsvp rsvp_status DEFAULT 'pending',
    
    -- Event Preferences
    dietary_restrictions TEXT,
    accommodation_needs TEXT,
    notes TEXT,
    
    -- Contact Details
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Table Assignment
    table_number INTEGER,
    table_name VARCHAR(100),
    
    -- Communication
    invitation_sent BOOLEAN DEFAULT FALSE,
    invitation_sent_date DATE,
    rsvp_date DATE,
    thank_you_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BUDGET MANAGEMENT
-- =============================================

-- Budget categories
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    allocated_amount DECIMAL(10,2) DEFAULT 0,
    spent_amount DECIMAL(10,2) DEFAULT 0,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget expenses
CREATE TABLE budget_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES couple_vendors(id) ON DELETE SET NULL,
    
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date_incurred DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    receipt_url VARCHAR(500),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TASK MANAGEMENT
-- =============================================

-- Task priority levels
CREATE TYPE task_priority AS ENUM (
    'low', 'medium', 'high', 'urgent'
);

-- Task assignment
CREATE TYPE task_assignment AS ENUM (
    'partner1', 'partner2', 'both', 'planner'
);

-- Task categories
CREATE TYPE task_category AS ENUM (
    'planning', 'venue', 'catering', 'photography', 'music', 
    'flowers', 'attire', 'invitations', 'transportation', 
    'beauty', 'honeymoon', 'legal', 'other'
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES couple_vendors(id) ON DELETE SET NULL,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category task_category DEFAULT 'planning',
    priority task_priority DEFAULT 'medium',
    assigned_to task_assignment DEFAULT 'both',
    
    -- Timing
    due_date DATE,
    estimated_duration_hours INTEGER,
    actual_duration_hours INTEGER,
    
    -- Status
    completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    completed_by_user_id UUID REFERENCES auth.users(id),
    
    -- Dependencies
    depends_on_task_id UUID REFERENCES tasks(id),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TIMELINE MANAGEMENT
-- =============================================

-- Timeline item types
CREATE TYPE timeline_type AS ENUM (
    'ceremony', 'reception', 'photo_session', 'vendor_arrival', 
    'vendor_setup', 'hair_makeup', 'getting_ready', 'transportation',
    'meal', 'speech', 'dance', 'special_moment', 'vendor_breakdown', 'other'
);

-- Timeline items (wedding day schedule)
CREATE TABLE timeline_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES couple_vendors(id) ON DELETE SET NULL,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type timeline_type DEFAULT 'other',
    
    -- Timing
    start_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INTEGER,
    buffer_time_minutes INTEGER DEFAULT 15,
    
    -- Location
    location VARCHAR(200),
    notes TEXT,
    
    -- Dependencies
    depends_on_item_id UUID REFERENCES timeline_items(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMMUNICATION & ACTIVITY
-- =============================================

-- Activity types for comprehensive logging
CREATE TYPE activity_type AS ENUM (
    -- Vendor activities
    'vendor_added', 'vendor_contacted', 'vendor_meeting_scheduled', 
    'vendor_proposal_received', 'vendor_quoted', 'vendor_booked', 
    'vendor_confirmed', 'vendor_cancelled', 'vendor_updated',
    
    -- Guest activities
    'guest_added', 'guest_updated', 'guest_deleted', 'invitation_sent',
    'rsvp_confirmed', 'rsvp_declined', 'rsvp_changed', 'plus_one_added',
    
    -- Budget activities
    'expense_added', 'expense_updated', 'expense_deleted', 'budget_exceeded',
    'payment_made', 'payment_due', 'budget_category_added',
    
    -- Task activities
    'task_created', 'task_completed', 'task_updated', 'task_overdue',
    'task_assigned', 'task_deleted',
    
    -- Timeline activities
    'timeline_item_added', 'timeline_updated', 'schedule_conflict',
    
    -- Communication activities
    'message_sent', 'contract_signed', 'receipt_uploaded', 'note_added',
    
    -- System activities
    'profile_updated', 'settings_changed', 'export_generated'
);

-- Activity feed table
CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Activity Details
    action_type activity_type NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255),
    
    -- User Information
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    
    -- Rich Context
    details JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    
    -- Read Status
    is_read BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages between couple members and vendors
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES couple_vendors(id) ON DELETE SET NULL,
    
    subject VARCHAR(200),
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general',
    
    -- Threading
    reply_to_message_id UUID REFERENCES messages(id),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BULLETPROOF ACTIVITY LOGGING FUNCTION
-- =============================================

-- This function NEVER fails - it always returns a UUID
CREATE OR REPLACE FUNCTION public.log_wedding_activity(
    p_couple_id UUID,
    p_user_id UUID,
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_entity_name TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_id UUID;
    user_email TEXT := 'unknown@example.com';
    user_name TEXT := 'Unknown User';
BEGIN
    -- NEVER FAIL - always return a UUID even if everything goes wrong
    
    -- Try to get user info, but don't fail if we can't
    BEGIN
        SELECT 
            COALESCE(email, 'unknown@example.com'),
            COALESCE(raw_user_meta_data->>'full_name', email, 'Unknown User')
        INTO user_email, user_name
        FROM auth.users 
        WHERE id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
        user_email := 'unknown@example.com';
        user_name := 'Unknown User';
    END;

    -- Try to insert activity, but don't fail if we can't
    BEGIN
        INSERT INTO public.activity_feed (
            couple_id, user_id, user_email, user_name,
            action_type, entity_type, entity_id, entity_name,
            details, is_read, created_at
        ) VALUES (
            p_couple_id, p_user_id, user_email, user_name,
            p_action_type::activity_type, p_entity_type, p_entity_id, 
            COALESCE(p_entity_name, 'Unknown'),
            COALESCE(p_details, '{}'::jsonb), 
            false, NOW()
        )
        RETURNING id INTO activity_id;
    EXCEPTION WHEN OTHERS THEN
        -- If insert fails for any reason, create dummy UUID and continue
        activity_id := gen_random_uuid();
        RAISE WARNING 'Activity logging failed but continuing: %', SQLERRM;
    END;

    -- ALWAYS return a UUID - core operations CANNOT fail because of activity logging
    RETURN COALESCE(activity_id, gen_random_uuid());
END;
$$;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Couples indexes
CREATE INDEX idx_couples_partner1_user ON couples(partner1_user_id);
CREATE INDEX idx_couples_partner2_user ON couples(partner2_user_id);
CREATE INDEX idx_couples_wedding_date ON couples(wedding_date);

-- Vendors indexes
CREATE INDEX idx_vendors_couple ON couple_vendors(couple_id);
CREATE INDEX idx_vendors_category ON couple_vendors(category);
CREATE INDEX idx_vendors_status ON couple_vendors(status);
CREATE INDEX idx_vendors_created_at ON couple_vendors(created_at);

-- Guests indexes
CREATE INDEX idx_guests_couple ON guests(couple_id);
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX idx_guests_category ON guests(category);
CREATE INDEX idx_guests_side ON guests(side);

-- Budget indexes
CREATE INDEX idx_budget_categories_couple ON budget_categories(couple_id);
CREATE INDEX idx_budget_expenses_couple ON budget_expenses(couple_id);
CREATE INDEX idx_budget_expenses_category ON budget_expenses(category_id);
CREATE INDEX idx_budget_expenses_vendor ON budget_expenses(vendor_id);

-- Task indexes
CREATE INDEX idx_tasks_couple ON tasks(couple_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_vendor ON tasks(vendor_id);

-- Timeline indexes
CREATE INDEX idx_timeline_couple ON timeline_items(couple_id);
CREATE INDEX idx_timeline_start_time ON timeline_items(start_time);
CREATE INDEX idx_timeline_vendor ON timeline_items(vendor_id);

-- Activity feed indexes
CREATE INDEX idx_activity_couple ON activity_feed(couple_id);
CREATE INDEX idx_activity_created_at ON activity_feed(created_at);
CREATE INDEX idx_activity_action_type ON activity_feed(action_type);
CREATE INDEX idx_activity_is_read ON activity_feed(is_read);

-- Messages indexes
CREATE INDEX idx_messages_couple ON messages(couple_id);
CREATE INDEX idx_messages_sender ON messages(sender_user_id);
CREATE INDEX idx_messages_vendor ON messages(vendor_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Couples policies
CREATE POLICY couples_access ON couples
    FOR ALL USING (
        partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    );

-- Vendor policies
CREATE POLICY vendors_access ON couple_vendors
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
        )
    );

-- Guest policies
CREATE POLICY guests_access ON guests
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
        )
    );

-- Budget policies
CREATE POLICY budget_categories_access ON budget_categories
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
        )
    );

CREATE POLICY budget_expenses_access ON budget_expenses
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
        )
    );

-- Task policies
CREATE POLICY tasks_access ON tasks
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
        )
    );

-- Timeline policies
CREATE POLICY timeline_access ON timeline_items
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
        )
    );

-- Activity feed policies
CREATE POLICY activity_access ON activity_feed
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
        )
    );

-- Message policies
CREATE POLICY messages_access ON messages
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
        )
    );

-- =============================================
-- GRANTS FOR AUTHENTICATED USERS
-- =============================================

-- Grant access to authenticated users
GRANT ALL ON couples TO authenticated;
GRANT ALL ON couple_vendors TO authenticated;
GRANT ALL ON guests TO authenticated;
GRANT ALL ON budget_categories TO authenticated;
GRANT ALL ON budget_expenses TO authenticated;
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON timeline_items TO authenticated;
GRANT ALL ON activity_feed TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Grant execute on activity logging function
GRANT EXECUTE ON FUNCTION public.log_wedding_activity TO authenticated;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_couples_updated_at BEFORE UPDATE ON couples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON couple_vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_expenses_updated_at BEFORE UPDATE ON budget_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_updated_at BEFORE UPDATE ON timeline_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();