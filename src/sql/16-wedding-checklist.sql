-- Wedding planning checklist system
-- Comprehensive checklist with timeline-based tasks and progress tracking

-- Create checklist templates table
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    wedding_style VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create checklist categories table
CREATE TABLE IF NOT EXISTS checklist_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create checklist items table (master list of all possible tasks)
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES checklist_categories(id) ON DELETE CASCADE,
    template_id UUID REFERENCES checklist_templates(id) ON DELETE SET NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    months_before_wedding INTEGER NOT NULL, -- How many months before wedding this should be done
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_hours DECIMAL(5,2),
    vendor_type VARCHAR(50), -- Links to specific vendor type if applicable
    is_optional BOOLEAN DEFAULT false,
    dependencies JSONB, -- Array of other task IDs that must be completed first
    tips TEXT, -- Helpful tips for completing this task
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user's checklist items (tracks progress for each couple)
CREATE TABLE IF NOT EXISTS user_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'delegated')),
    completed_date DATE,
    completed_by VARCHAR(255),
    assigned_to VARCHAR(20) CHECK (assigned_to IN ('partner1', 'partner2', 'both', 'vendor', 'other')),
    notes TEXT,
    actual_hours DECIMAL(5,2),
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    due_date DATE,
    reminder_date DATE,
    custom_task BOOLEAN DEFAULT false, -- If true, this is a custom task added by the user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(couple_id, checklist_item_id)
);

-- Create custom checklist items for user-added tasks
CREATE TABLE IF NOT EXISTS custom_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES checklist_categories(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completed_date DATE,
    assigned_to VARCHAR(20) CHECK (assigned_to IN ('partner1', 'partner2', 'both', 'vendor', 'other')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create checklist reminders table
CREATE TABLE IF NOT EXISTS checklist_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_checklist_item_id UUID REFERENCES user_checklist_items(id) ON DELETE CASCADE,
    custom_checklist_item_id UUID REFERENCES custom_checklist_items(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    reminder_type VARCHAR(20) CHECK (reminder_type IN ('email', 'push', 'sms')),
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (user_checklist_item_id IS NOT NULL AND custom_checklist_item_id IS NULL) OR
        (user_checklist_item_id IS NULL AND custom_checklist_item_id IS NOT NULL)
    )
);

-- Insert default categories
INSERT INTO checklist_categories (category_name, icon, display_order, description) VALUES
('Planning & Budget', '📋', 1, 'Initial planning, budget, and timeline'),
('Venue & Catering', '🏛️', 2, 'Reception venue, ceremony location, and food'),
('Vendors', '📸', 3, 'Photography, videography, music, and other services'),
('Attire & Beauty', '👗', 4, 'Wedding dress, suits, hair, and makeup'),
('Stationery', '💌', 5, 'Invitations, save-the-dates, and programs'),
('Flowers & Decor', '💐', 6, 'Floral arrangements and decorations'),
('Guest Management', '👥', 7, 'Guest list, accommodations, and RSVPs'),
('Legal & Documentation', '📄', 8, 'Marriage license and legal requirements'),
('Ceremony Details', '💍', 9, 'Ceremony planning and religious requirements'),
('Reception Details', '🎉', 10, 'Reception planning and entertainment'),
('Transportation', '🚗', 11, 'Transportation for wedding party and guests'),
('Honeymoon', '✈️', 12, 'Honeymoon planning and preparations'),
('Final Preparations', '✅', 13, 'Last-minute tasks and day-of coordination')
ON CONFLICT DO NOTHING;

-- Insert default checklist template
INSERT INTO checklist_templates (template_name, description, is_default) VALUES
('Traditional Wedding Checklist', 'Comprehensive checklist for traditional weddings', true)
ON CONFLICT DO NOTHING;

-- Insert checklist items (sample - would be much more comprehensive in production)
WITH template AS (
    SELECT id FROM checklist_templates WHERE is_default = true LIMIT 1
),
categories AS (
    SELECT id, category_name FROM checklist_categories
)
INSERT INTO checklist_items (category_id, template_id, task_name, description, months_before_wedding, priority, vendor_type, tips) 
SELECT 
    c.id,
    t.id,
    task_name,
    description,
    months_before,
    priority,
    vendor_type,
    tips
FROM template t, categories c
JOIN (VALUES
    -- 12+ Months Before
    ('Planning & Budget', 'Set wedding budget', 'Determine overall budget and allocate funds to different categories', 12, 'critical', NULL, 'Consider all funding sources and be realistic about costs'),
    ('Planning & Budget', 'Create wedding timeline', 'Establish key dates and deadlines for planning', 12, 'high', NULL, 'Work backwards from your wedding date'),
    ('Planning & Budget', 'Hire wedding planner', 'Research and book a wedding planner if desired', 12, 'medium', 'planner', 'Interview multiple planners and check references'),
    ('Planning & Budget', 'Create guest list', 'Draft initial guest list with must-have guests', 12, 'high', NULL, 'Start with immediate family and closest friends'),
    ('Venue & Catering', 'Book ceremony venue', 'Reserve ceremony location', 12, 'critical', 'venue', 'Popular venues book up to 18 months in advance'),
    ('Venue & Catering', 'Book reception venue', 'Reserve reception location', 12, 'critical', 'venue', 'Consider capacity, location, and included services'),
    
    -- 10-11 Months Before
    ('Vendors', 'Book photographer', 'Research and book wedding photographer', 10, 'critical', 'photographer', 'Review full wedding galleries, not just highlights'),
    ('Vendors', 'Book videographer', 'Research and book wedding videographer', 10, 'high', 'videographer', 'Decide on video style and coverage hours'),
    ('Vendors', 'Book band/DJ', 'Secure entertainment for reception', 10, 'high', 'music', 'Attend a live performance if possible'),
    ('Venue & Catering', 'Book caterer', 'Select and book catering service', 10, 'critical', 'caterer', 'Schedule tastings with top choices'),
    ('Attire & Beauty', 'Start dress shopping', 'Begin looking for wedding dress', 10, 'high', NULL, 'Allow 6-8 months for ordering and alterations'),
    
    -- 8-9 Months Before
    ('Stationery', 'Order save-the-dates', 'Design and order save-the-date cards', 9, 'high', 'stationery', 'Include wedding website if available'),
    ('Guest Management', 'Reserve room blocks', 'Book hotel room blocks for out-of-town guests', 9, 'medium', NULL, 'Negotiate group rates and cutoff dates'),
    ('Vendors', 'Book florist', 'Select and book floral designer', 8, 'high', 'florist', 'Bring inspiration photos and color swatches'),
    ('Attire & Beauty', 'Order wedding dress', 'Place order for wedding dress', 8, 'critical', NULL, 'Confirm delivery timeline and alteration schedule'),
    
    -- 6-7 Months Before
    ('Stationery', 'Send save-the-dates', 'Mail save-the-date cards', 7, 'high', NULL, 'Send 6-8 months before wedding'),
    ('Vendors', 'Book officiant', 'Secure ceremony officiant', 7, 'critical', 'officiant', 'Discuss ceremony requirements and personalization'),
    ('Transportation', 'Book transportation', 'Arrange wedding day transportation', 6, 'medium', 'transportation', 'Consider guest shuttles if needed'),
    ('Attire & Beauty', 'Shop for groom attire', 'Select and order groom and groomsmen attire', 6, 'high', NULL, 'Coordinate with wedding colors'),
    
    -- 4-5 Months Before
    ('Stationery', 'Order invitations', 'Design and order wedding invitations', 5, 'high', 'stationery', 'Order 20% extra for mistakes and keepsakes'),
    ('Reception Details', 'Plan menu', 'Finalize catering menu and service style', 5, 'high', NULL, 'Consider dietary restrictions and preferences'),
    ('Flowers & Decor', 'Finalize floral design', 'Confirm all floral arrangements and decor', 4, 'high', NULL, 'Review contract and delivery details'),
    ('Attire & Beauty', 'Book hair and makeup', 'Schedule hair and makeup artists', 4, 'high', 'hair_makeup', 'Book trials 2-3 months before wedding'),
    
    -- 2-3 Months Before
    ('Stationery', 'Send invitations', 'Mail wedding invitations', 3, 'critical', NULL, 'Send 6-8 weeks before wedding'),
    ('Legal & Documentation', 'Obtain marriage license', 'Apply for marriage license', 2, 'critical', NULL, 'Check local requirements and timing'),
    ('Ceremony Details', 'Plan ceremony', 'Finalize ceremony order and readings', 2, 'high', NULL, 'Coordinate with officiant and venue'),
    ('Reception Details', 'Create seating chart', 'Design reception seating arrangements', 2, 'medium', NULL, 'Wait for most RSVPs before finalizing'),
    
    -- 1 Month Before
    ('Final Preparations', 'Final venue walkthrough', 'Meet with all vendors at venue', 1, 'high', NULL, 'Create detailed timeline and floor plans'),
    ('Final Preparations', 'Confirm vendor details', 'Reconfirm all vendor arrangements', 1, 'critical', NULL, 'Get arrival times and contact numbers'),
    ('Guest Management', 'Finalize headcount', 'Get final guest count to vendors', 1, 'critical', NULL, 'Follow up on missing RSVPs'),
    ('Attire & Beauty', 'Final dress fitting', 'Complete final alterations', 1, 'high', NULL, 'Bring shoes and undergarments to fitting'),
    
    -- 1 Week Before
    ('Final Preparations', 'Rehearsal', 'Conduct ceremony rehearsal', 0, 'critical', NULL, 'Include all wedding party members'),
    ('Final Preparations', 'Pack for honeymoon', 'Prepare honeymoon luggage', 0, 'medium', NULL, 'Check passport and travel documents'),
    ('Final Preparations', 'Prepare payments', 'Organize final vendor payments and tips', 0, 'high', NULL, 'Designate someone to distribute on wedding day'),
    ('Final Preparations', 'Confirm timeline', 'Distribute final timeline to wedding party', 0, 'critical', NULL, 'Include contact information for all vendors')
) AS task_list(category_name, task_name, description, months_before, priority, vendor_type, tips)
ON c.category_name = task_list.category_name
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON checklist_items(category_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_template ON checklist_items(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_months ON checklist_items(months_before_wedding);
CREATE INDEX IF NOT EXISTS idx_user_checklist_couple ON user_checklist_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_status ON user_checklist_items(status);
CREATE INDEX IF NOT EXISTS idx_user_checklist_due ON user_checklist_items(due_date);
CREATE INDEX IF NOT EXISTS idx_custom_checklist_couple ON custom_checklist_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON checklist_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON checklist_reminders(sent);

-- Enable RLS
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for checklist_templates (everyone can read)
CREATE POLICY "Everyone can view checklist templates"
    ON checklist_templates FOR SELECT
    USING (true);

-- RLS policies for checklist_categories (everyone can read)
CREATE POLICY "Everyone can view checklist categories"
    ON checklist_categories FOR SELECT
    USING (true);

-- RLS policies for checklist_items (everyone can read)
CREATE POLICY "Everyone can view checklist items"
    ON checklist_items FOR SELECT
    USING (true);

-- RLS policies for user_checklist_items
CREATE POLICY "Couples can view their own checklist items"
    ON user_checklist_items FOR SELECT
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
               OR partner2_user_id = auth.uid()
        )
    );

CREATE POLICY "Couples can create their own checklist items"
    ON user_checklist_items FOR INSERT
    WITH CHECK (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
               OR partner2_user_id = auth.uid()
        )
    );

CREATE POLICY "Couples can update their own checklist items"
    ON user_checklist_items FOR UPDATE
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
               OR partner2_user_id = auth.uid()
        )
    );

CREATE POLICY "Couples can delete their own checklist items"
    ON user_checklist_items FOR DELETE
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
               OR partner2_user_id = auth.uid()
        )
    );

-- RLS policies for custom_checklist_items
CREATE POLICY "Couples can manage their custom checklist items"
    ON custom_checklist_items FOR ALL
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
               OR partner2_user_id = auth.uid()
        )
    );

-- RLS policies for checklist_reminders
CREATE POLICY "Couples can manage their checklist reminders"
    ON checklist_reminders FOR ALL
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
               OR partner2_user_id = auth.uid()
        )
    );

-- Function to initialize user's checklist based on wedding date
CREATE OR REPLACE FUNCTION initialize_wedding_checklist(
    p_couple_id UUID,
    p_wedding_date DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_template_id UUID;
    v_wedding_date DATE;
    v_months_diff INTEGER;
BEGIN
    -- Get the default template
    SELECT id INTO v_template_id 
    FROM checklist_templates 
    WHERE is_default = true 
    LIMIT 1;
    
    -- Get wedding date from couple if not provided
    IF p_wedding_date IS NULL THEN
        SELECT wedding_date INTO v_wedding_date
        FROM couples
        WHERE id = p_couple_id;
    ELSE
        v_wedding_date := p_wedding_date;
    END IF;
    
    -- If no wedding date, use 12 months from now as default
    IF v_wedding_date IS NULL THEN
        v_wedding_date := CURRENT_DATE + INTERVAL '12 months';
    END IF;
    
    -- Calculate months until wedding
    v_months_diff := EXTRACT(YEAR FROM v_wedding_date) * 12 + EXTRACT(MONTH FROM v_wedding_date) 
                   - EXTRACT(YEAR FROM CURRENT_DATE) * 12 - EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Insert checklist items for the couple
    INSERT INTO user_checklist_items (couple_id, checklist_item_id, due_date, status)
    SELECT 
        p_couple_id,
        ci.id,
        CASE 
            WHEN ci.months_before_wedding = 0 THEN v_wedding_date - INTERVAL '7 days'
            ELSE v_wedding_date - (ci.months_before_wedding || ' months')::INTERVAL
        END,
        CASE 
            WHEN v_months_diff < ci.months_before_wedding THEN 'pending' -- overdue items
            ELSE 'pending'
        END
    FROM checklist_items ci
    WHERE ci.template_id = v_template_id
    ON CONFLICT (couple_id, checklist_item_id) DO NOTHING;
    
    -- Get count of inserted items
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get checklist progress
CREATE OR REPLACE FUNCTION get_checklist_progress(p_couple_id UUID)
RETURNS TABLE (
    total_tasks INTEGER,
    completed_tasks INTEGER,
    in_progress_tasks INTEGER,
    pending_tasks INTEGER,
    overdue_tasks INTEGER,
    completion_percentage INTEGER,
    next_due_task JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH task_stats AS (
        SELECT 
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed,
            COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending,
            COUNT(*) FILTER (WHERE status = 'pending' AND due_date < CURRENT_DATE) AS overdue
        FROM user_checklist_items
        WHERE couple_id = p_couple_id
    ),
    next_task AS (
        SELECT 
            jsonb_build_object(
                'id', uci.id,
                'task_name', ci.task_name,
                'category', cc.category_name,
                'due_date', uci.due_date,
                'priority', ci.priority
            ) AS task_info
        FROM user_checklist_items uci
        JOIN checklist_items ci ON uci.checklist_item_id = ci.id
        JOIN checklist_categories cc ON ci.category_id = cc.id
        WHERE uci.couple_id = p_couple_id
          AND uci.status = 'pending'
          AND uci.due_date >= CURRENT_DATE
        ORDER BY uci.due_date, ci.priority DESC
        LIMIT 1
    )
    SELECT 
        ts.total::INTEGER,
        ts.completed::INTEGER,
        ts.in_progress::INTEGER,
        ts.pending::INTEGER,
        ts.overdue::INTEGER,
        CASE 
            WHEN ts.total > 0 THEN (ts.completed * 100 / ts.total)::INTEGER
            ELSE 0
        END,
        nt.task_info
    FROM task_stats ts
    CROSS JOIN LATERAL (SELECT COALESCE(task_info, '{}'::jsonb) AS task_info FROM next_task) nt;
END;
$$ LANGUAGE plpgsql;