-- Create wedding_couples table
CREATE TABLE IF NOT EXISTS public.wedding_couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner1_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner2_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner1_name TEXT NOT NULL,
    partner2_name TEXT,
    wedding_date DATE,
    wedding_style TEXT,
    guest_count_estimate INTEGER,
    budget_total DECIMAL(10, 2),
    venue_name TEXT,
    venue_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_feed table
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES public.wedding_couples(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'completed', 'invited', 'responded')),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_name TEXT,
    details JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('created', 'updated', 'deleted', 'completed', 'invited', 'responded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create wedding_guests table
CREATE TABLE IF NOT EXISTS public.wedding_guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES public.wedding_couples(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    invite_code TEXT UNIQUE,
    rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'attending', 'not_attending', 'maybe')),
    plus_one BOOLEAN DEFAULT FALSE,
    plus_one_name TEXT,
    dietary_restrictions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wedding_couples_partner1_user_id ON public.wedding_couples(partner1_user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_couples_partner2_user_id ON public.wedding_couples(partner2_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_couple_id ON public.activity_feed(couple_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_couple_id ON public.wedding_guests(couple_id);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_invite_code ON public.wedding_guests(invite_code);

-- Enable Row Level Security
ALTER TABLE public.wedding_couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_guests ENABLE ROW LEVEL SECURITY;

-- Create policies for wedding_couples
CREATE POLICY "Users can view their own couple profile" ON public.wedding_couples
    FOR SELECT USING (auth.uid() = partner1_user_id OR auth.uid() = partner2_user_id);

CREATE POLICY "Users can update their own couple profile" ON public.wedding_couples
    FOR UPDATE USING (auth.uid() = partner1_user_id OR auth.uid() = partner2_user_id);

CREATE POLICY "Users can insert couple profile" ON public.wedding_couples
    FOR INSERT WITH CHECK (auth.uid() = partner1_user_id OR auth.uid() = partner2_user_id);

-- Create policies for activity_feed
CREATE POLICY "Users can view their couple's activities" ON public.activity_feed
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wedding_couples
            WHERE wedding_couples.id = activity_feed.couple_id
            AND (wedding_couples.partner1_user_id = auth.uid() OR wedding_couples.partner2_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create activities for their couple" ON public.activity_feed
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wedding_couples
            WHERE wedding_couples.id = activity_feed.couple_id
            AND (wedding_couples.partner1_user_id = auth.uid() OR wedding_couples.partner2_user_id = auth.uid())
        )
    );

-- Create policies for wedding_guests
CREATE POLICY "Users can view their couple's guests" ON public.wedding_guests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wedding_couples
            WHERE wedding_couples.id = wedding_guests.couple_id
            AND (wedding_couples.partner1_user_id = auth.uid() OR wedding_couples.partner2_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their couple's guests" ON public.wedding_guests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.wedding_couples
            WHERE wedding_couples.id = wedding_guests.couple_id
            AND (wedding_couples.partner1_user_id = auth.uid() OR wedding_couples.partner2_user_id = auth.uid())
        )
    );

-- Create a function to log wedding activity
CREATE OR REPLACE FUNCTION log_wedding_activity(
    p_couple_id UUID,
    p_user_id UUID,
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_entity_name TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO public.activity_feed (
        couple_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        entity_name,
        details
    ) VALUES (
        p_couple_id,
        p_user_id,
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        p_details
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;