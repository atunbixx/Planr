-- Wedding Checklist Management Schema
-- Run this in Supabase SQL Editor to enable checklist functionality

-- Checklist categories table for organizing tasks by timeline
CREATE TABLE IF NOT EXISTS checklist_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    timeline_months INTEGER NOT NULL, -- months before wedding (e.g., 12 for "12+ months before")
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color for UI
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default checklist categories
INSERT INTO checklist_categories (name, description, timeline_months, color, display_order) VALUES
('12+ Months Before', 'Early planning essentials', 12, '#10B981', 1),
('6-12 Months Before', 'Major vendors and arrangements', 9, '#3B82F6', 2),
('3-6 Months Before', 'Detailed planning and preparations', 4, '#F59E0B', 3),
('1-3 Months Before', 'Final preparations and confirmations', 2, '#F97316', 4),
('1 Month Before', 'Last-minute details', 1, '#EF4444', 5),
('Week of Wedding', 'Final countdown tasks', 0, '#8B5CF6', 6)
ON CONFLICT (name) DO NOTHING;

-- Checklist tasks table
CREATE TABLE IF NOT EXISTS checklist_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    category_id UUID REFERENCES checklist_categories(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    is_custom BOOLEAN DEFAULT false, -- true if user-created, false if system default
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    assigned_to VARCHAR(100), -- partner1, partner2, both, or specific name
    reminder_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default checklist tasks
INSERT INTO checklist_tasks (category_id, title, description, priority, is_custom) 
SELECT 
    c.id,
    task.title,
    task.description,
    task.priority,
    false
FROM checklist_categories c
CROSS JOIN (
    -- 12+ Months Before tasks
    SELECT '12+ Months Before' as category, 'Set wedding date' as title, 'Choose your special day and make it official' as description, 'high' as priority
    UNION ALL SELECT '12+ Months Before', 'Determine budget', 'Set a realistic budget for your wedding expenses', 'high'
    UNION ALL SELECT '12+ Months Before', 'Book venue', 'Secure your ceremony and reception locations', 'high'
    UNION ALL SELECT '12+ Months Before', 'Create guest list draft', 'Start compiling your guest list to determine venue size', 'medium'
    UNION ALL SELECT '12+ Months Before', 'Research photographers', 'Start looking at photography styles and portfolios', 'medium'
    UNION ALL SELECT '12+ Months Before', 'Start dress shopping', 'Begin looking at dress styles and designers', 'medium'
    
    -- 6-12 Months Before tasks
    UNION ALL SELECT '6-12 Months Before', 'Book photographer', 'Secure your wedding photographer', 'high'
    UNION ALL SELECT '6-12 Months Before', 'Book caterer', 'Choose your food service provider', 'high'
    UNION ALL SELECT '6-12 Months Before', 'Choose wedding dress', 'Purchase your wedding dress', 'high'
    UNION ALL SELECT '6-12 Months Before', 'Book music/DJ', 'Secure entertainment for your reception', 'high'
    UNION ALL SELECT '6-12 Months Before', 'Book officiant', 'Secure someone to perform your ceremony', 'high'
    UNION ALL SELECT '6-12 Months Before', 'Register for gifts', 'Set up your wedding registry', 'medium'
    UNION ALL SELECT '6-12 Months Before', 'Book transportation', 'Arrange wedding day transportation', 'low'
    
    -- 3-6 Months Before tasks
    UNION ALL SELECT '3-6 Months Before', 'Send save-the-dates', 'Mail save-the-date cards to guests', 'high'
    UNION ALL SELECT '3-6 Months Before', 'Order invitations', 'Design and order wedding invitations', 'high'
    UNION ALL SELECT '3-6 Months Before', 'Plan menu with caterer', 'Finalize your wedding menu', 'medium'
    UNION ALL SELECT '3-6 Months Before', 'Book florist', 'Choose your floral arrangements', 'medium'
    UNION ALL SELECT '3-6 Months Before', 'Choose wedding cake', 'Decide on your wedding cake design', 'medium'
    UNION ALL SELECT '3-6 Months Before', 'Plan honeymoon', 'Book your honeymoon destination', 'low'
    UNION ALL SELECT '3-6 Months Before', 'Buy wedding rings', 'Purchase your wedding bands', 'high'
    
    -- 1-3 Months Before tasks
    UNION ALL SELECT '1-3 Months Before', 'Send wedding invitations', 'Mail wedding invitations to guests', 'high'
    UNION ALL SELECT '1-3 Months Before', 'Final dress fitting', 'Complete alterations on wedding dress', 'high'
    UNION ALL SELECT '1-3 Months Before', 'Order wedding cake', 'Confirm cake order and details', 'medium'
    UNION ALL SELECT '1-3 Months Before', 'Confirm all vendors', 'Double-check all vendor details', 'high'
    UNION ALL SELECT '1-3 Months Before', 'Plan seating chart', 'Create reception seating arrangements', 'medium'
    UNION ALL SELECT '1-3 Months Before', 'Get marriage license', 'Obtain your marriage license', 'high'
    UNION ALL SELECT '1-3 Months Before', 'Plan rehearsal dinner', 'Organize pre-wedding celebration', 'medium'
    
    -- 1 Month Before tasks
    UNION ALL SELECT '1 Month Before', 'Confirm RSVPs', 'Follow up on any missing responses', 'high'
    UNION ALL SELECT '1 Month Before', 'Final guest count to caterer', 'Provide final headcount', 'high'
    UNION ALL SELECT '1 Month Before', 'Pick up wedding dress', 'Collect your finished dress', 'high'
    UNION ALL SELECT '1 Month Before', 'Confirm timeline with vendors', 'Review day-of schedules', 'medium'
    UNION ALL SELECT '1 Month Before', 'Pack for honeymoon', 'Prepare for your post-wedding trip', 'low'
    UNION ALL SELECT '1 Month Before', 'Prepare wedding favors', 'Finalize guest favors', 'low'
    
    -- Week of Wedding tasks
    UNION ALL SELECT 'Week of Wedding', 'Pick up flowers', 'Collect floral arrangements', 'high'
    UNION ALL SELECT 'Week of Wedding', 'Rehearsal and dinner', 'Practice ceremony and celebrate', 'high'
    UNION ALL SELECT 'Week of Wedding', 'Prepare emergency kit', 'Pack day-of essentials', 'medium'
    UNION ALL SELECT 'Week of Wedding', 'Delegate day-of tasks', 'Assign responsibilities to wedding party', 'medium'
    UNION ALL SELECT 'Week of Wedding', 'Get good sleep', 'Rest well before your big day', 'high'
    UNION ALL SELECT 'Week of Wedding', 'Enjoy your wedding!', 'Celebrate your special day', 'high'
) task
WHERE c.name = task.category
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE checklist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_categories (public read)
CREATE POLICY "Anyone can view checklist categories" ON checklist_categories
    FOR SELECT USING (true);

-- RLS Policies for checklist_tasks
CREATE POLICY "Users can view their couple's checklist tasks" ON checklist_tasks
    FOR SELECT USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert checklist tasks for their couple" ON checklist_tasks
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their couple's checklist tasks" ON checklist_tasks
    FOR UPDATE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete their couple's checklist tasks" ON checklist_tasks
    FOR DELETE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Update triggers
CREATE TRIGGER update_checklist_categories_updated_at BEFORE UPDATE ON checklist_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_tasks_updated_at BEFORE UPDATE ON checklist_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get checklist progress for a couple
CREATE OR REPLACE FUNCTION get_checklist_progress(p_couple_id UUID)
RETURNS TABLE(
    total_tasks INTEGER,
    completed_tasks INTEGER,
    progress_percentage DECIMAL,
    overdue_tasks INTEGER,
    upcoming_tasks INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tasks,
        COUNT(CASE WHEN is_completed = true THEN 1 END)::INTEGER as completed_tasks,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN is_completed = true THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 1)
            ELSE 0
        END as progress_percentage,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND is_completed = false THEN 1 END)::INTEGER as overdue_tasks,
        COUNT(CASE WHEN due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND is_completed = false THEN 1 END)::INTEGER as upcoming_tasks
    FROM checklist_tasks
    WHERE couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get checklist tasks by category for a couple
CREATE OR REPLACE FUNCTION get_checklist_by_category(p_couple_id UUID)
RETURNS TABLE(
    category_id UUID,
    category_name VARCHAR(100),
    category_color VARCHAR(7),
    timeline_months INTEGER,
    total_tasks INTEGER,
    completed_tasks INTEGER,
    tasks JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id as category_id,
        cc.name as category_name,
        cc.color as category_color,
        cc.timeline_months,
        COUNT(ct.id)::INTEGER as total_tasks,
        COUNT(CASE WHEN ct.is_completed = true THEN 1 END)::INTEGER as completed_tasks,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ct.id,
                    'title', ct.title,
                    'description', ct.description,
                    'is_completed', ct.is_completed,
                    'priority', ct.priority,
                    'due_date', ct.due_date,
                    'completed_at', ct.completed_at,
                    'notes', ct.notes,
                    'assigned_to', ct.assigned_to,
                    'is_custom', ct.is_custom
                ) ORDER BY ct.is_completed ASC, ct.priority DESC, ct.created_at ASC
            ) FILTER (WHERE ct.id IS NOT NULL),
            '[]'::jsonb
        ) as tasks
    FROM checklist_categories cc
    LEFT JOIN checklist_tasks ct ON ct.category_id = cc.id AND ct.couple_id = p_couple_id
    GROUP BY cc.id, cc.name, cc.color, cc.timeline_months, cc.display_order
    ORDER BY cc.display_order;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_couple_id ON checklist_tasks(couple_id);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_category_id ON checklist_tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_is_completed ON checklist_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_due_date ON checklist_tasks(due_date);

-- Verify tables were created successfully
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_name IN ('checklist_categories', 'checklist_tasks')
    AND t.table_schema = 'public'
ORDER BY t.table_name;