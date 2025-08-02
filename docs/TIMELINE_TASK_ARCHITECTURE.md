# Wedding Timeline & Task Management System Architecture

## Executive Summary

This document outlines the comprehensive architecture for an enhanced Wedding Timeline & Task Management system that integrates pre-wedding task planning with wedding day timeline management. The system provides couples with a unified platform to manage all wedding-related tasks from initial planning through the wedding day execution.

## System Overview

### Core Components
1. **Task Management System** - Pre-wedding planning tasks with dependencies
2. **Timeline Management System** - Wedding day schedule and coordination
3. **Milestone System** - Major checkpoints linking tasks to timeline
4. **Notification System** - Reminders and alerts for tasks and timeline events
5. **Analytics Dashboard** - Progress tracking and insights

### Key Features
- Intelligent task suggestions based on wedding date
- Dependency management with critical path analysis
- Timeline visualization with Gantt charts and Kanban boards
- Vendor integration for automatic task creation
- Mobile-responsive design with offline capabilities
- Real-time collaboration between partners

## Database Architecture

### Enhanced Schema Design

#### 1. Core Tables Enhancement

```sql
-- Enhanced tasks table with timeline integration
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timeline_item_id UUID REFERENCES timeline_items(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_pattern VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_template_id UUID REFERENCES task_templates(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS critical_path BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Enhanced timeline_items table
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id);
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS critical_path BOOLEAN DEFAULT FALSE;
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS confirmation_date TIMESTAMPTZ;
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS weather_dependent BOOLEAN DEFAULT FALSE;
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS indoor_alternative TEXT;
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200);
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE timeline_items ADD COLUMN IF NOT EXISTS special_requirements TEXT[];

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    completed_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('planning', 'vendor', 'legal', 'personal', 'financial', 'day_of')),
    icon VARCHAR(50),
    color VARCHAR(7),
    task_ids UUID[] DEFAULT '{}',
    timeline_item_ids UUID[] DEFAULT '{}',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
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
    UNIQUE(task_id, assigned_to_user_id, assigned_to_vendor_id)
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
    conflict_type VARCHAR(50) CHECK (conflict_type IN ('time_overlap', 'location_conflict', 'vendor_conflict', 'dependency_issue')),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
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
    reminder_type VARCHAR(20) CHECK (reminder_type IN ('email', 'sms', 'push', 'in_app')),
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
```

#### 2. Views for Analytics

```sql
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
    AVG(CASE WHEN t.completed = true AND t.due_date IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (t.completed_date::timestamp - t.due_date::timestamp)) / 86400 
        ELSE NULL END) AS avg_completion_delay_days,
    COUNT(DISTINCT t.category) AS active_categories,
    COUNT(DISTINCT t.vendor_id) AS vendors_with_tasks
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
    COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids)) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids) AND t.completed = true) AS completed_tasks,
    CASE 
        WHEN COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids)) > 0
        THEN (COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids) AND t.completed = true) * 100 / 
              COUNT(t.id) FILTER (WHERE t.id = ANY(m.task_ids)))
        ELSE 0
    END AS calculated_progress
FROM milestones m
LEFT JOIN tasks t ON t.id = ANY(m.task_ids)
GROUP BY m.id, m.couple_id, m.title, m.target_date, m.status;
```

#### 3. Functions for Smart Features

```sql
-- Function to calculate critical path
CREATE OR REPLACE FUNCTION calculate_critical_path(p_couple_id UUID)
RETURNS TABLE (task_id UUID, slack_days INTEGER) AS $$
WITH RECURSIVE task_graph AS (
    -- Base case: tasks with no dependencies
    SELECT 
        t.id,
        t.due_date,
        0 AS path_length,
        ARRAY[t.id] AS path
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
        tg.path || t.id
    FROM tasks t
    JOIN task_dependencies td ON t.id = td.task_id
    JOIN task_graph tg ON td.depends_on_task_id = tg.id
    WHERE t.couple_id = p_couple_id
      AND NOT (t.id = ANY(tg.path)) -- Prevent cycles
)
SELECT 
    t.id AS task_id,
    EXTRACT(DAY FROM (MAX(tg.due_date) - t.due_date)) AS slack_days
FROM tasks t
JOIN task_graph tg ON t.id = tg.id
GROUP BY t.id, t.due_date;
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
              AND start_time < COALESCE(v_item1.end_time, v_item1.start_time + (v_item1.duration_minutes || ' minutes')::INTERVAL)
        LOOP
            INSERT INTO timeline_conflicts (
                couple_id, item1_id, item2_id, conflict_type, severity
            ) VALUES (
                p_couple_id, v_item1.id, v_item2.id, 'time_overlap',
                CASE 
                    WHEN v_item1.vendor_id = v_item2.vendor_id THEN 'critical'
                    WHEN v_item1.location = v_item2.location THEN 'high'
                    ELSE 'medium'
                END
            ) ON CONFLICT (item1_id, item2_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    -- Check for vendor conflicts (same vendor at different locations)
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
    
    -- Return suggested tasks based on vendor type
    RETURN QUERY
    SELECT 
        tt.name,
        tt.description,
        v_wedding_date - (tt.months_before_wedding || ' months')::INTERVAL AS suggested_due_date,
        tt.category,
        'medium'::task_priority
    FROM task_templates tt
    WHERE tt.vendor_type = v_vendor.vendor_type
      AND tt.is_default = true
    ORDER BY tt.months_before_wedding DESC;
END;
$$ LANGUAGE plpgsql;
```

## UI Component Architecture

### 1. Timeline Visualization Components

```typescript
// Timeline visualization components structure
interface TimelineComponents {
  // Main Timeline Views
  TimelineGanttChart: {
    props: {
      items: TimelineItem[]
      tasks: Task[]
      milestones: Milestone[]
      viewMode: 'day' | 'week' | 'month'
      onItemClick: (item: TimelineItem | Task) => void
      onItemDrag: (item: TimelineItem | Task, newDate: Date) => void
    }
  }
  
  TimelineKanbanBoard: {
    props: {
      tasks: Task[]
      columns: TaskStatus[]
      onTaskMove: (taskId: string, newStatus: TaskStatus) => void
      onTaskClick: (task: Task) => void
    }
  }
  
  TimelineCalendarView: {
    props: {
      tasks: Task[]
      timelineItems: TimelineItem[]
      milestones: Milestone[]
      onDateClick: (date: Date) => void
      onEventClick: (event: Task | TimelineItem) => void
    }
  }
  
  // Detail Components
  TaskDetailModal: {
    props: {
      task: Task
      onUpdate: (updates: TaskUpdate) => void
      onAssign: (userId: string | vendorId: string) => void
      onAddComment: (comment: string) => void
      onAddAttachment: (file: File) => void
      onClose: () => void
    }
  }
  
  TimelineItemDetail: {
    props: {
      item: TimelineItem
      onUpdate: (updates: TimelineItemUpdate) => void
      onConfirm: () => void
      onAddAlternative: (alternative: string) => void
      onClose: () => void
    }
  }
  
  // Creation Components
  QuickTaskAdd: {
    props: {
      categories: TaskCategory[]
      vendors: Vendor[]
      onAdd: (task: TaskInsert) => void
    }
  }
  
  BulkTaskImport: {
    props: {
      templates: TaskTemplate[]
      onImport: (tasks: TaskInsert[]) => void
    }
  }
  
  // Analytics Components
  TaskProgressChart: {
    props: {
      analytics: TaskAnalytics
      timeRange: 'week' | 'month' | 'all'
    }
  }
  
  CriticalPathView: {
    props: {
      tasks: Task[]
      dependencies: TaskDependency[]
      onHighlight: (taskIds: string[]) => void
    }
  }
  
  MilestoneTracker: {
    props: {
      milestones: Milestone[]
      onUpdate: (milestoneId: string, progress: number) => void
    }
  }
}
```

### 2. Mobile-Optimized Components

```typescript
// Mobile-specific timeline components
interface MobileTimelineComponents {
  SwipeableTaskList: {
    props: {
      tasks: Task[]
      onSwipeComplete: (taskId: string) => void
      onSwipeDelete: (taskId: string) => void
      onPullToRefresh: () => void
    }
  }
  
  MobileTimelineView: {
    props: {
      items: TimelineItem[]
      onItemTap: (item: TimelineItem) => void
      onLongPress: (item: TimelineItem) => void
    }
  }
  
  QuickActionFAB: {
    props: {
      actions: QuickAction[]
      onAction: (action: QuickAction) => void
    }
  }
  
  OfflineTaskQueue: {
    props: {
      pendingActions: PendingAction[]
      onSync: () => void
      onDiscard: (actionId: string) => void
    }
  }
}
```

## API Architecture

### 1. RESTful API Endpoints

```typescript
// Timeline & Task API Routes
const apiRoutes = {
  // Task Management
  '/api/tasks': {
    GET: 'List all tasks with filters',
    POST: 'Create new task',
  },
  '/api/tasks/:id': {
    GET: 'Get task details',
    PUT: 'Update task',
    DELETE: 'Delete task',
  },
  '/api/tasks/:id/complete': {
    POST: 'Mark task as complete',
    DELETE: 'Mark task as incomplete',
  },
  '/api/tasks/:id/assign': {
    POST: 'Assign task to user/vendor',
    DELETE: 'Unassign task',
  },
  '/api/tasks/:id/comments': {
    GET: 'Get task comments',
    POST: 'Add comment to task',
  },
  '/api/tasks/:id/attachments': {
    GET: 'Get task attachments',
    POST: 'Upload attachment',
    DELETE: 'Remove attachment',
  },
  '/api/tasks/bulk': {
    POST: 'Bulk create/update tasks',
    DELETE: 'Bulk delete tasks',
  },
  '/api/tasks/templates': {
    GET: 'Get task templates',
    POST: 'Create custom template',
  },
  
  // Timeline Management
  '/api/timeline': {
    GET: 'Get timeline items',
    POST: 'Create timeline item',
  },
  '/api/timeline/:id': {
    GET: 'Get timeline item details',
    PUT: 'Update timeline item',
    DELETE: 'Delete timeline item',
  },
  '/api/timeline/:id/confirm': {
    POST: 'Confirm timeline item',
  },
  '/api/timeline/conflicts': {
    GET: 'Get timeline conflicts',
    POST: 'Detect conflicts',
    PUT: 'Resolve conflict',
  },
  '/api/timeline/templates': {
    GET: 'Get timeline templates',
    POST: 'Apply template',
  },
  
  // Milestones
  '/api/milestones': {
    GET: 'Get milestones',
    POST: 'Create milestone',
  },
  '/api/milestones/:id': {
    GET: 'Get milestone details',
    PUT: 'Update milestone',
    DELETE: 'Delete milestone',
  },
  '/api/milestones/:id/progress': {
    PUT: 'Update milestone progress',
  },
  
  // Analytics & Insights
  '/api/analytics/tasks': {
    GET: 'Get task analytics',
  },
  '/api/analytics/timeline': {
    GET: 'Get timeline analytics',
  },
  '/api/analytics/critical-path': {
    GET: 'Calculate critical path',
  },
  '/api/analytics/predictions': {
    GET: 'Get ML-based predictions',
  },
  
  // Integrations
  '/api/integrations/calendar/sync': {
    POST: 'Sync with external calendar',
  },
  '/api/integrations/vendor/:vendorId/tasks': {
    GET: 'Get suggested vendor tasks',
    POST: 'Auto-create vendor tasks',
  },
}
```

### 2. Real-time Updates

```typescript
// WebSocket events for real-time collaboration
interface RealtimeEvents {
  // Task events
  'task:created': { task: Task }
  'task:updated': { taskId: string, updates: TaskUpdate }
  'task:completed': { taskId: string, completedBy: string }
  'task:assigned': { taskId: string, assignedTo: string }
  'task:commented': { taskId: string, comment: TaskComment }
  
  // Timeline events
  'timeline:updated': { itemId: string, updates: TimelineItemUpdate }
  'timeline:conflict': { conflict: TimelineConflict }
  'timeline:confirmed': { itemId: string, confirmedBy: string }
  
  // Milestone events
  'milestone:progress': { milestoneId: string, progress: number }
  'milestone:completed': { milestoneId: string }
  
  // Collaboration events
  'user:typing': { userId: string, context: string }
  'user:viewing': { userId: string, itemId: string, itemType: string }
}
```

## Integration Architecture

### 1. Vendor Integration

```typescript
// Vendor task automation
interface VendorIntegration {
  autoCreateTasks: (vendorBooking: VendorBooking) => Task[]
  syncVendorSchedule: (vendorId: string) => TimelineItem[]
  importVendorChecklist: (vendorId: string) => TaskTemplate[]
  notifyVendorAssignment: (task: Task, vendor: Vendor) => void
}
```

### 2. Calendar Integration

```typescript
// External calendar sync
interface CalendarIntegration {
  exportToGoogle: (tasks: Task[], timeline: TimelineItem[]) => void
  exportToApple: (tasks: Task[], timeline: TimelineItem[]) => void
  exportToOutlook: (tasks: Task[], timeline: TimelineItem[]) => void
  importFromICS: (icsFile: File) => { tasks: Task[], events: TimelineItem[] }
  setupTwoWaySync: (calendarProvider: string, credentials: any) => void
}
```

### 3. Budget Integration

```typescript
// Link tasks to budget items
interface BudgetIntegration {
  linkTaskToBudget: (taskId: string, budgetItemId: string) => void
  createBudgetFromTask: (task: Task) => BudgetItem
  trackTaskExpenses: (taskId: string) => ExpenseReport
  forecastBudgetImpact: (tasks: Task[]) => BudgetForecast
}
```

## Smart Features Implementation

### 1. AI-Powered Suggestions

```typescript
// ML-based task suggestions
interface SmartSuggestions {
  suggestNextTasks: (completedTasks: Task[], weddingDate: Date) => Task[]
  predictTaskDuration: (task: Task, historicalData: Task[]) => number
  identifyRisks: (tasks: Task[], timeline: TimelineItem[]) => Risk[]
  optimizeSchedule: (tasks: Task[], constraints: Constraint[]) => Schedule
}
```

### 2. Automated Workflows

```typescript
// Workflow automation
interface WorkflowAutomation {
  triggers: {
    onVendorBooked: (vendor: Vendor) => void
    onMilestoneReached: (milestone: Milestone) => void
    onTaskOverdue: (task: Task) => void
    onConflictDetected: (conflict: TimelineConflict) => void
  }
  
  actions: {
    createTasks: (templates: TaskTemplate[]) => Task[]
    sendReminders: (recipients: User[], message: string) => void
    adjustTimeline: (conflicts: TimelineConflict[]) => TimelineItem[]
    escalateToPlanner: (issue: Issue) => void
  }
}
```

## Security & Permissions

### 1. Row-Level Security

```sql
-- RLS policies for new tables
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

-- Similar policies for other tables...
```

### 2. Permission Levels

```typescript
// Permission system for tasks and timeline
interface Permissions {
  roles: {
    'couple_admin': ['create', 'read', 'update', 'delete', 'assign'],
    'couple_member': ['create', 'read', 'update', 'complete'],
    'vendor': ['read', 'update:assigned', 'complete:assigned'],
    'guest': ['read:shared'],
  }
  
  checkPermission: (user: User, action: string, resource: any) => boolean
  grantPermission: (userId: string, resourceId: string, permission: string) => void
  revokePermission: (userId: string, resourceId: string, permission: string) => void
}
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Indexes for performance
CREATE INDEX idx_tasks_couple_due ON tasks(couple_id, due_date);
CREATE INDEX idx_tasks_couple_status ON tasks(couple_id, completed, due_date);
CREATE INDEX idx_timeline_couple_start ON timeline_items(couple_id, start_time);
CREATE INDEX idx_milestones_couple_date ON milestones(couple_id, target_date);
CREATE INDEX idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends ON task_dependencies(depends_on_task_id);

-- Materialized view for dashboard
CREATE MATERIALIZED VIEW couple_task_summary AS
SELECT 
  couple_id,
  COUNT(*) FILTER (WHERE completed = false AND due_date < CURRENT_DATE) AS overdue_count,
  COUNT(*) FILTER (WHERE completed = false AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) AS upcoming_week_count,
  COUNT(*) FILTER (WHERE completed = true AND completed_date >= CURRENT_DATE - 7) AS completed_week_count,
  COUNT(*) FILTER (WHERE critical_path = true AND completed = false) AS critical_pending_count
FROM tasks
GROUP BY couple_id;

CREATE INDEX idx_couple_task_summary ON couple_task_summary(couple_id);
```

### 2. Caching Strategy

```typescript
// Caching implementation
interface CachingStrategy {
  // Cache frequently accessed data
  cacheKeys: {
    taskList: (coupleId: string, filters?: any) => string
    timelineItems: (coupleId: string, date?: Date) => string
    milestones: (coupleId: string) => string
    analytics: (coupleId: string, type: string) => string
  }
  
  // Cache invalidation
  invalidate: {
    onTaskUpdate: (taskId: string) => void
    onTimelineUpdate: (itemId: string) => void
    onMilestoneUpdate: (milestoneId: string) => void
  }
  
  // Prefetching
  prefetch: {
    upcomingTasks: (days: number) => void
    todayTimeline: () => void
    criticalPath: () => void
  }
}
```

## Mobile & Offline Support

### 1. Offline Data Sync

```typescript
// Offline capability implementation
interface OfflineSupport {
  // Local storage schema
  localDB: {
    tasks: LocalDB<Task>
    timeline: LocalDB<TimelineItem>
    milestones: LocalDB<Milestone>
    pendingChanges: LocalDB<PendingChange>
  }
  
  // Sync operations
  sync: {
    pushChanges: () => Promise<SyncResult>
    pullChanges: (lastSync: Date) => Promise<SyncResult>
    resolveConflicts: (conflicts: Conflict[]) => Promise<Resolution[]>
  }
  
  // Offline actions
  offline: {
    createTask: (task: TaskInsert) => string
    updateTask: (taskId: string, updates: TaskUpdate) => void
    completeTask: (taskId: string) => void
    queueAction: (action: Action) => void
  }
}
```

### 2. Progressive Web App Features

```typescript
// PWA enhancements for timeline/tasks
interface PWAFeatures {
  // Push notifications
  notifications: {
    taskReminder: (task: Task) => Notification
    milestoneAlert: (milestone: Milestone) => Notification
    conflictWarning: (conflict: TimelineConflict) => Notification
  }
  
  // Background sync
  backgroundSync: {
    syncTasks: () => void
    updateTimeline: () => void
    checkConflicts: () => void
  }
  
  // App shortcuts
  shortcuts: [
    { name: 'Add Task', url: '/tasks/new' },
    { name: 'Today\'s Timeline', url: '/timeline/today' },
    { name: 'Task Dashboard', url: '/tasks' },
  ]
}
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
1. Implement enhanced database schema
2. Create basic CRUD APIs for tasks and timeline
3. Build core UI components
4. Set up real-time subscriptions

### Phase 2: Advanced Features (Weeks 3-4)
1. Implement dependency management
2. Add milestone tracking
3. Build Gantt chart visualization
4. Create conflict detection

### Phase 3: Smart Features (Weeks 5-6)
1. Implement task templates and suggestions
2. Add critical path analysis
3. Build analytics dashboard
4. Create automated workflows

### Phase 4: Integration & Polish (Weeks 7-8)
1. Integrate with vendor system
2. Add calendar sync
3. Implement offline support
4. Performance optimization
5. Mobile app enhancements

## Success Metrics

1. **User Engagement**
   - Daily active users
   - Tasks created per couple
   - Task completion rate
   - Timeline confirmation rate

2. **Performance**
   - Page load time < 2s
   - API response time < 200ms
   - Offline sync time < 5s
   - 99.9% uptime

3. **User Satisfaction**
   - Task management NPS > 8
   - Feature adoption rate > 70%
   - Support ticket reduction by 40%
   - User retention > 90%

## Conclusion

This comprehensive architecture provides couples with a powerful, integrated system for managing both pre-wedding tasks and wedding day timeline. The system's smart features, real-time collaboration, and mobile-first design ensure couples stay organized and stress-free throughout their wedding planning journey.