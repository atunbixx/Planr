-- Enhanced Timeline & Task Management System
-- This migration adds comprehensive features for wedding planning tasks and timeline management

-- Create new enums
CREATE TYPE IF NOT EXISTS task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled', 'blocked');
CREATE TYPE IF NOT EXISTS milestone_type AS ENUM ('planning', 'vendor', 'legal', 'personal', 'financial', 'day_of');
CREATE TYPE IF NOT EXISTS milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'delayed');
CREATE TYPE IF NOT EXISTS dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish');
CREATE TYPE IF NOT EXISTS conflict_type AS ENUM ('time_overlap', 'location_conflict', 'vendor_conflict', 'dependency_issue');
CREATE TYPE IF NOT EXISTS conflict_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE IF NOT EXISTS reminder_type AS ENUM ('email', 'sms', 'push', 'in_app');

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    completed_date DATE,
    status milestone_status DEFAULT 'pending',
    type milestone_type NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    task_ids UUID[] DEFAULT '{}',
    timeline_item_ids UUID[] DEFAULT '{}',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to existing tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS timeline_item_id UUID REFERENCES timeline_items(id),
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id),
ADD COLUMN IF NOT EXISTS recurring_pattern VARCHAR(50),
ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
ADD COLUMN IF NOT EXISTS task_template_id UUID,
ADD COLUMN IF NOT EXISTS critical_path BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS status task_status DEFAULT 'todo';

-- Add columns to existing timeline_items table
ALTER TABLE timeline_items
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id),
ADD COLUMN IF NOT EXISTS critical_path BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmation_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS weather_dependent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS indoor_alternative TEXT,
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS special_requirements TEXT[];

-- Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type dependency_type DEFAULT 'finish_to_start',
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category task_category NOT NULL,
    vendor_type VARCHAR(50),
    typical_duration_days INTEGER,
    months_before_wedding INTEGER,
    subtasks JSONB DEFAULT '[]',
    tips TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_to_user_id UUID REFERENCES auth.users(id),
    assigned_to_vendor_id UUID REFERENCES couple_vendors(id),
    assigned_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(task_id, assigned_to_user_id, assigned_to_vendor_id),
    CHECK (
        (assigned_to_user_id IS NOT NULL AND assigned_to_vendor_id IS NULL) OR
        (assigned_to_user_id IS NULL AND assigned_to_vendor_id IS NOT NULL)
    )
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_conflicts table
CREATE TABLE IF NOT EXISTS timeline_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    item1_id UUID NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    item2_id UUID NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    conflict_type conflict_type NOT NULL,
    severity conflict_severity NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(item1_id, item2_id)
);

-- Create task_reminders table
CREATE TABLE IF NOT EXISTS task_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    reminder_date TIMESTAMPTZ NOT NULL,
    reminder_type reminder_type NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_templates table
CREATE TABLE IF NOT EXISTS timeline_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    wedding_style VARCHAR(50),
    guest_count_range VARCHAR(50),
    duration_hours INTEGER,
    items JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_couple_due ON tasks(couple_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_couple_status ON tasks(couple_id, completed, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone_id) WHERE milestone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_timeline_item ON tasks(timeline_item_id) WHERE timeline_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_critical_path ON tasks(couple_id, critical_path) WHERE critical_path = TRUE;
CREATE INDEX IF NOT EXISTS idx_timeline_couple_start ON timeline_items(couple_id, start_time);
CREATE INDEX IF NOT EXISTS idx_timeline_milestone ON timeline_items(milestone_id) WHERE milestone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_confirmed ON timeline_items(couple_id, confirmed);
CREATE INDEX IF NOT EXISTS idx_milestones_couple_date ON milestones(couple_id, target_date);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(couple_id, status);
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(assigned_to_user_id) WHERE assigned_to_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_assignments_vendor ON task_assignments(assigned_to_vendor_id) WHERE assigned_to_vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_timeline_conflicts_couple ON timeline_conflicts(couple_id, resolved);
CREATE INDEX IF NOT EXISTS idx_task_reminders_date ON task_reminders(reminder_date, sent);

-- Create task analytics view
CREATE OR REPLACE VIEW task_analytics AS
SELECT 
    c.id AS couple_id,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = true) AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = false AND t.due_date < CURRENT_DATE) AS overdue_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = false AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') AS upcoming_week_tasks,
    COUNT(t.id) FILTER (WHERE t.priority = 'urgent') AS urgent_tasks,
    COUNT(t.id) FILTER (WHERE t.critical_path = true) AS critical_path_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'blocked') AS blocked_tasks,
    AVG(CASE WHEN t.completed = true AND t.due_date IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (t.completed_date::timestamp - t.due_date::timestamp)) / 86400 
        ELSE NULL END) AS avg_completion_delay_days,
    COUNT(DISTINCT t.category) AS active_categories,
    COUNT(DISTINCT t.vendor_id) AS vendors_with_tasks,
    AVG(t.progress_percentage) AS avg_task_progress
FROM couples c
LEFT JOIN tasks t ON c.id = t.couple_id
GROUP BY c.id;

-- Create timeline analytics view
CREATE OR REPLACE VIEW timeline_analytics AS
SELECT 
    c.id AS couple_id,
    COUNT(ti.id) AS total_timeline_items,
    COUNT(ti.id) FILTER (WHERE ti.confirmed = true) AS confirmed_items,
    COUNT(ti.id) FILTER (WHERE ti.vendor_id IS NOT NULL) AS vendor_items,
    COUNT(ti.id) FILTER (WHERE ti.weather_dependent = true) AS weather_dependent_items,
    COUNT(DISTINCT ti.location) AS unique_locations,
    MIN(ti.start_time) AS earliest_start_time,
    MAX(ti.end_time) AS latest_end_time,
    SUM(ti.duration_minutes) AS total_duration_minutes,
    AVG(ti.buffer_time_minutes) AS avg_buffer_time,
    COUNT(tc.id) AS unresolved_conflicts
FROM couples c
LEFT JOIN timeline_items ti ON c.id = ti.couple_id
LEFT JOIN timeline_conflicts tc ON c.id = tc.couple_id AND tc.resolved = false
GROUP BY c.id;

-- Create milestone progress view
CREATE OR REPLACE VIEW milestone_progress AS
SELECT 
    m.id,
    m.couple_id,
    m.title,
    m.target_date,
    m.status,
    m.type,
    COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids)) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids) AND t.completed = true) AS completed_tasks,
    CASE 
        WHEN COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids)) > 0
        THEN (COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids) AND t.completed = true) * 100 / 
              COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids)))
        ELSE m.progress_percentage
    END AS calculated_progress,
    m.target_date - CURRENT_DATE AS days_until_target
FROM milestones m
LEFT JOIN tasks t ON t.id = ANY(m.task_ids)
GROUP BY m.id, m.couple_id, m.title, m.target_date, m.status, m.type, m.progress_percentage;

-- Function to calculate critical path
CREATE OR REPLACE FUNCTION calculate_critical_path(p_couple_id UUID)
RETURNS TABLE (task_id UUID, slack_days INTEGER, is_critical BOOLEAN) AS $$
WITH RECURSIVE task_graph AS (
    -- Base case: tasks with no dependencies
    SELECT 
        t.id,
        t.due_date,
        0 AS path_length,
        ARRAY[t.id] AS path,
        t.estimated_duration_hours::DECIMAL / 24 AS duration_days
    FROM tasks t
    WHERE t.couple_id = p_couple_id
      AND NOT EXISTS (
          SELECT 1 FROM task_dependencies td 
          WHERE td.task_id = t.id
      )
    
    UNION ALL
    
    -- Recursive case
    SELECT 
        t.id,
        t.due_date,
        tg.path_length + 1,
        tg.path || t.id,
        COALESCE(t.estimated_duration_hours::DECIMAL / 24, 1) + tg.duration_days
    FROM tasks t
    JOIN task_dependencies td ON t.id = td.task_id
    JOIN task_graph tg ON td.depends_on_task_id = tg.id
    WHERE t.couple_id = p_couple_id
      AND NOT (t.id = ANY(tg.path)) -- Prevent cycles
),
max_path AS (
    SELECT MAX(duration_days) AS max_duration
    FROM task_graph
)
SELECT 
    t.id AS task_id,
    CASE 
        WHEN t.due_date IS NULL THEN 0
        ELSE EXTRACT(DAY FROM (t.due_date - CURRENT_DATE))::INTEGER - tg.duration_days::INTEGER
    END AS slack_days,
    tg.duration_days = mp.max_duration AS is_critical
FROM tasks t
JOIN task_graph tg ON t.id = tg.id
CROSS JOIN max_path mp
WHERE t.couple_id = p_couple_id;
$$ LANGUAGE sql;

-- Function to detect timeline conflicts
CREATE OR REPLACE FUNCTION detect_timeline_conflicts(p_couple_id UUID)
RETURNS VOID AS $$
DECLARE
    v_item1 RECORD;
    v_item2 RECORD;
BEGIN
    -- Clear existing conflicts for this couple
    DELETE FROM timeline_conflicts WHERE couple_id = p_couple_id;
    
    -- Check for time overlaps
    FOR v_item1 IN 
        SELECT * FROM timeline_items 
        WHERE couple_id = p_couple_id 
        ORDER BY start_time
    LOOP
        FOR v_item2 IN 
            SELECT * FROM timeline_items 
            WHERE couple_id = p_couple_id 
              AND id != v_item1.id
              AND start_time >= v_item1.start_time
              AND start_time < COALESCE(
                  v_item1.end_time, 
                  v_item1.start_time + (COALESCE(v_item1.duration_minutes, 0) || ' minutes')::INTERVAL
              )
        LOOP
            INSERT INTO timeline_conflicts (
                couple_id, item1_id, item2_id, conflict_type, severity
            ) VALUES (
                p_couple_id, v_item1.id, v_item2.id, 'time_overlap',
                CASE 
                    WHEN v_item1.vendor_id IS NOT NULL AND v_item1.vendor_id = v_item2.vendor_id THEN 'critical'
                    WHEN v_item1.location = v_item2.location THEN 'high'
                    ELSE 'medium'
                END
            ) ON CONFLICT (item1_id, item2_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    -- Check for vendor conflicts (same vendor at different locations at overlapping times)
    INSERT INTO timeline_conflicts (couple_id, item1_id, item2_id, conflict_type, severity)
    SELECT 
        p_couple_id,
        ti1.id,
        ti2.id,
        'vendor_conflict',
        'high'
    FROM timeline_items ti1
    JOIN timeline_items ti2 ON ti1.vendor_id = ti2.vendor_id
    WHERE ti1.couple_id = p_couple_id
      AND ti2.couple_id = p_couple_id
      AND ti1.id < ti2.id
      AND ti1.location != ti2.location
      AND ti1.vendor_id IS NOT NULL
      AND (
          (ti2.start_time BETWEEN ti1.start_time AND COALESCE(ti1.end_time, ti1.start_time + (ti1.duration_minutes || ' minutes')::INTERVAL))
          OR
          (ti1.start_time BETWEEN ti2.start_time AND COALESCE(ti2.end_time, ti2.start_time + (ti2.duration_minutes || ' minutes')::INTERVAL))
      )
    ON CONFLICT (item1_id, item2_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest tasks based on vendor bookings
CREATE OR REPLACE FUNCTION suggest_vendor_tasks(p_couple_id UUID, p_vendor_id UUID)
RETURNS TABLE (
    task_title VARCHAR(200),
    task_description TEXT,
    suggested_due_date DATE,
    category task_category,
    priority task_priority
) AS $$
DECLARE
    v_vendor RECORD;
    v_wedding_date DATE;
BEGIN
    -- Get vendor and wedding details
    SELECT cv.*, c.wedding_date 
    INTO v_vendor
    FROM couple_vendors cv
    JOIN couples c ON cv.couple_id = c.id
    WHERE cv.id = p_vendor_id AND cv.couple_id = p_couple_id;
    
    v_wedding_date := v_vendor.wedding_date;
    
    -- If no wedding date, use 12 months from now
    IF v_wedding_date IS NULL THEN
        v_wedding_date := CURRENT_DATE + INTERVAL '12 months';
    END IF;
    
    -- Return suggested tasks based on vendor type
    RETURN QUERY
    SELECT 
        tt.name,
        tt.description,
        v_wedding_date - (COALESCE(tt.months_before_wedding, 6) || ' months')::INTERVAL AS suggested_due_date,
        tt.category,
        'medium'::task_priority
    FROM task_templates tt
    WHERE tt.vendor_type = v_vendor.vendor_type
      AND tt.is_default = true
    ORDER BY tt.months_before_wedding DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update milestone progress
CREATE OR REPLACE FUNCTION update_milestone_progress(p_milestone_id UUID)
RETURNS VOID AS $$
DECLARE
    v_progress INTEGER;
    v_status milestone_status;
BEGIN
    -- Calculate progress based on associated tasks
    SELECT 
        CASE 
            WHEN COUNT(t.id) = 0 THEN 0
            ELSE (COUNT(t.id) FILTER (WHERE t.completed = true) * 100 / COUNT(t.id))::INTEGER
        END INTO v_progress
    FROM milestones m
    LEFT JOIN tasks t ON t.id = ANY(m.task_ids)
    WHERE m.id = p_milestone_id
    GROUP BY m.id;
    
    -- Determine status based on progress and dates
    SELECT 
        CASE 
            WHEN v_progress = 100 THEN 'completed'::milestone_status
            WHEN v_progress > 0 THEN 'in_progress'::milestone_status
            WHEN target_date < CURRENT_DATE THEN 'delayed'::milestone_status
            ELSE 'pending'::milestone_status
        END INTO v_status
    FROM milestones
    WHERE id = p_milestone_id;
    
    -- Update milestone
    UPDATE milestones
    SET 
        progress_percentage = v_progress,
        status = v_status,
        completed_date = CASE WHEN v_status = 'completed' THEN CURRENT_DATE ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_milestone_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for milestones
CREATE POLICY "Users can view their couple's milestones"
    ON milestones FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their couple's milestones"
    ON milestones FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    ));

-- RLS Policies for task_dependencies
CREATE POLICY "Users can view task dependencies"
    ON task_dependencies FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tasks t
        JOIN couples c ON t.couple_id = c.id
        WHERE t.id = task_dependencies.task_id
        AND (c.partner1_user_id = auth.uid() OR c.partner2_user_id = auth.uid())
    ));

CREATE POLICY "Users can manage task dependencies"
    ON task_dependencies FOR ALL
    USING (EXISTS (
        SELECT 1 FROM tasks t
        JOIN couples c ON t.couple_id = c.id
        WHERE t.id = task_dependencies.task_id
        AND (c.partner1_user_id = auth.uid() OR c.partner2_user_id = auth.uid())
    ));

-- RLS Policies for task_templates (everyone can read)
CREATE POLICY "Everyone can view task templates"
    ON task_templates FOR SELECT
    USING (true);

-- RLS Policies for task_assignments
CREATE POLICY "Users can view task assignments"
    ON task_assignments FOR SELECT
    USING (
        assigned_to_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN couples c ON t.couple_id = c.id
            WHERE t.id = task_assignments.task_id
            AND (c.partner1_user_id = auth.uid() OR c.partner2_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create task assignments"
    ON task_assignments FOR INSERT
    WITH CHECK (
        assigned_by_user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN couples c ON t.couple_id = c.id
            WHERE t.id = task_assignments.task_id
            AND (c.partner1_user_id = auth.uid() OR c.partner2_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own task assignments"
    ON task_assignments FOR UPDATE
    USING (assigned_to_user_id = auth.uid());

-- RLS Policies for task_comments
CREATE POLICY "Users can view task comments"
    ON task_comments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tasks t
        JOIN couples c ON t.couple_id = c.id
        WHERE t.id = task_comments.task_id
        AND (c.partner1_user_id = auth.uid() OR c.partner2_user_id = auth.uid())
    ));

CREATE POLICY "Users can create task comments"
    ON task_comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN couples c ON t.couple_id = c.id
            WHERE t.id = task_comments.task_id
            AND (c.partner1_user_id = auth.uid() OR c.partner2_user_id = auth.uid())
        )
    );

-- RLS Policies for timeline_conflicts
CREATE POLICY "Users can view their timeline conflicts"
    ON timeline_conflicts FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their timeline conflicts"
    ON timeline_conflicts FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    ));

-- RLS Policies for task_reminders
CREATE POLICY "Users can view their task reminders"
    ON task_reminders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their task reminders"
    ON task_reminders FOR ALL
    USING (user_id = auth.uid());

-- RLS Policies for timeline_templates (everyone can read)
CREATE POLICY "Everyone can view timeline templates"
    ON timeline_templates FOR SELECT
    USING (true);

-- Insert default task templates
INSERT INTO task_templates (name, description, category, vendor_type, months_before_wedding, is_default) VALUES
-- Venue tasks
('Schedule venue walkthrough', 'Final walkthrough with venue coordinator', 'venue', 'venue', 1, true),
('Confirm venue layout', 'Finalize floor plan and seating arrangement', 'venue', 'venue', 2, true),
('Submit final guest count', 'Provide final headcount to venue', 'venue', 'venue', 1, true),

-- Photography tasks
('Schedule engagement shoot', 'Book engagement photo session', 'photography', 'photographer', 8, true),
('Create shot list', 'List must-have photos for wedding day', 'photography', 'photographer', 2, true),
('Confirm photography timeline', 'Review day-of schedule with photographer', 'photography', 'photographer', 1, true),

-- Catering tasks
('Schedule tasting', 'Arrange menu tasting appointment', 'catering', 'caterer', 6, true),
('Finalize menu', 'Select final menu options', 'catering', 'caterer', 3, true),
('Provide dietary restrictions', 'Share guest dietary needs', 'catering', 'caterer', 1, true),

-- Music tasks
('Submit song requests', 'Provide must-play and do-not-play lists', 'music', 'band', 2, true),
('Confirm equipment needs', 'Verify sound system requirements', 'music', 'band', 1, true),

-- Florist tasks
('Review floral proposal', 'Approve final floral designs', 'flowers', 'florist', 3, true),
('Confirm delivery schedule', 'Verify flower delivery times', 'flowers', 'florist', 1, true)
ON CONFLICT DO NOTHING;

-- Insert default timeline template
INSERT INTO timeline_templates (name, description, wedding_style, is_default, items) VALUES
('Classic Wedding Day Timeline', 'Traditional wedding day schedule', 'classic', true, 
'[
  {
    "time": "08:00",
    "duration": 180,
    "title": "Hair and Makeup",
    "type": "hair_makeup",
    "location": "Bridal Suite"
  },
  {
    "time": "09:00",
    "duration": 60,
    "title": "Photographer Arrives",
    "type": "vendor_arrival",
    "location": "Getting Ready Location"
  },
  {
    "time": "13:00",
    "duration": 45,
    "title": "First Look",
    "type": "photo_session",
    "location": "Photo Location"
  },
  {
    "time": "15:00",
    "duration": 45,
    "title": "Ceremony",
    "type": "ceremony",
    "location": "Ceremony Venue"
  },
  {
    "time": "16:00",
    "duration": 90,
    "title": "Cocktail Hour",
    "type": "reception",
    "location": "Reception Venue"
  },
  {
    "time": "18:00",
    "duration": 90,
    "title": "Dinner Service",
    "type": "meal",
    "location": "Reception Venue"
  },
  {
    "time": "20:00",
    "duration": 5,
    "title": "First Dance",
    "type": "dance",
    "location": "Dance Floor"
  }
]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create trigger to update milestone progress when tasks change
CREATE OR REPLACE FUNCTION trigger_update_milestone_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update progress for milestones containing this task
    IF TG_OP = 'UPDATE' AND (OLD.completed IS DISTINCT FROM NEW.completed) THEN
        PERFORM update_milestone_progress(m.id)
        FROM milestones m
        WHERE NEW.id = ANY(m.task_ids);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_milestone_on_task_change
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_milestone_progress();

-- Create trigger to detect conflicts when timeline items change
CREATE OR REPLACE FUNCTION trigger_detect_timeline_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Detect conflicts for the couple when timeline items change
    PERFORM detect_timeline_conflicts(NEW.couple_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER detect_conflicts_on_timeline_change
    AFTER INSERT OR UPDATE ON timeline_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_detect_timeline_conflicts();

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_templates_updated_at BEFORE UPDATE ON timeline_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();