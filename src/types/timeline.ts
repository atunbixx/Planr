// Timeline & Task Management Types

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskCategory = 
  | 'planning' 
  | 'venue' 
  | 'catering' 
  | 'photography' 
  | 'music' 
  | 'flowers' 
  | 'attire' 
  | 'invitations' 
  | 'transportation' 
  | 'beauty' 
  | 'honeymoon' 
  | 'legal' 
  | 'other'
export type TaskAssignment = 'partner1' | 'partner2' | 'both' | 'planner'

export type MilestoneType = 'planning' | 'vendor' | 'legal' | 'personal' | 'financial' | 'day_of'
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed'

export type TimelineType = 
  | 'ceremony' 
  | 'reception' 
  | 'photo_session' 
  | 'vendor_arrival' 
  | 'vendor_setup' 
  | 'hair_makeup' 
  | 'getting_ready' 
  | 'transportation' 
  | 'meal' 
  | 'speech' 
  | 'dance' 
  | 'special_moment' 
  | 'vendor_breakdown' 
  | 'other'

export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
export type ConflictType = 'time_overlap' | 'location_conflict' | 'vendor_conflict' | 'dependency_issue'
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ReminderType = 'email' | 'sms' | 'push' | 'in_app'

// Enhanced Task interface
export interface Task {
  id: string
  couple_id: string
  vendor_id?: string
  timeline_item_id?: string
  milestone_id?: string
  task_template_id?: string
  title: string
  description?: string
  category: TaskCategory
  priority: TaskPriority
  assigned_to: TaskAssignment
  due_date?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number
  completed: boolean
  completed_date?: string
  completed_by_user_id?: string
  depends_on_task_id?: string
  status: TaskStatus
  recurring_pattern?: string
  recurring_end_date?: string
  critical_path: boolean
  blocked_reason?: string
  attachments: any[]
  tags: string[]
  progress_percentage: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface TaskInsert {
  vendor_id?: string
  timeline_item_id?: string
  milestone_id?: string
  task_template_id?: string
  title: string
  description?: string
  category?: TaskCategory
  priority?: TaskPriority
  assigned_to?: TaskAssignment
  due_date?: string
  estimated_duration_hours?: number
  depends_on_task_id?: string
  recurring_pattern?: string
  recurring_end_date?: string
  tags?: string[]
  notes?: string
}

export interface TaskUpdate {
  title?: string
  description?: string
  category?: TaskCategory
  priority?: TaskPriority
  assigned_to?: TaskAssignment
  due_date?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number
  depends_on_task_id?: string
  status?: TaskStatus
  recurring_pattern?: string
  recurring_end_date?: string
  critical_path?: boolean
  blocked_reason?: string
  attachments?: any[]
  tags?: string[]
  progress_percentage?: number
  notes?: string
}

// Enhanced Timeline Item interface
export interface TimelineItem {
  id: string
  couple_id: string
  vendor_id?: string
  milestone_id?: string
  title: string
  description?: string
  type: TimelineType
  start_time: string
  end_time?: string
  duration_minutes?: number
  buffer_time_minutes: number
  location?: string
  notes?: string
  depends_on_item_id?: string
  critical_path: boolean
  confirmed: boolean
  confirmation_date?: string
  weather_dependent: boolean
  indoor_alternative?: string
  contact_person?: string
  contact_phone?: string
  special_requirements: string[]
  created_at: string
  updated_at: string
}

export interface TimelineItemInsert {
  vendor_id?: string
  milestone_id?: string
  title: string
  description?: string
  type?: TimelineType
  start_time: string
  end_time?: string
  duration_minutes?: number
  buffer_time_minutes?: number
  location?: string
  notes?: string
  depends_on_item_id?: string
  weather_dependent?: boolean
  indoor_alternative?: string
  contact_person?: string
  contact_phone?: string
  special_requirements?: string[]
}

export interface TimelineItemUpdate {
  title?: string
  description?: string
  type?: TimelineType
  start_time?: string
  end_time?: string
  duration_minutes?: number
  buffer_time_minutes?: number
  location?: string
  notes?: string
  depends_on_item_id?: string
  critical_path?: boolean
  confirmed?: boolean
  weather_dependent?: boolean
  indoor_alternative?: string
  contact_person?: string
  contact_phone?: string
  special_requirements?: string[]
}

// Milestone interface
export interface Milestone {
  id: string
  couple_id: string
  title: string
  description?: string
  target_date: string
  completed_date?: string
  status: MilestoneStatus
  type: MilestoneType
  icon?: string
  color?: string
  task_ids: string[]
  timeline_item_ids: string[]
  progress_percentage: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface MilestoneInsert {
  title: string
  description?: string
  target_date: string
  type: MilestoneType
  icon?: string
  color?: string
  task_ids?: string[]
  timeline_item_ids?: string[]
  notes?: string
}

export interface MilestoneUpdate {
  title?: string
  description?: string
  target_date?: string
  completed_date?: string
  status?: MilestoneStatus
  type?: MilestoneType
  icon?: string
  color?: string
  task_ids?: string[]
  timeline_item_ids?: string[]
  progress_percentage?: number
  notes?: string
}

// Task Dependencies
export interface TaskDependency {
  id: string
  task_id: string
  depends_on_task_id: string
  dependency_type: DependencyType
  lag_days: number
  created_at: string
}

// Task Templates
export interface TaskTemplate {
  id: string
  name: string
  description?: string
  category: TaskCategory
  vendor_type?: string
  typical_duration_days?: number
  months_before_wedding?: number
  subtasks: any[]
  tips?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// Task Assignments
export interface TaskAssignmentRecord {
  id: string
  task_id: string
  assigned_to_user_id?: string
  assigned_to_vendor_id?: string
  assigned_by_user_id: string
  assigned_at: string
  accepted: boolean
  accepted_at?: string
  notes?: string
}

// Task Comments
export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  updated_at: string
}

// Timeline Conflicts
export interface TimelineConflict {
  id: string
  couple_id: string
  item1_id: string
  item2_id: string
  conflict_type: ConflictType
  severity: ConflictSeverity
  resolved: boolean
  resolution_notes?: string
  detected_at: string
  resolved_at?: string
}

// Task Reminders
export interface TaskReminder {
  id: string
  task_id: string
  user_id: string
  reminder_date: string
  reminder_type: ReminderType
  sent: boolean
  sent_at?: string
  created_at: string
}

// Timeline Templates
export interface TimelineTemplate {
  id: string
  name: string
  description?: string
  wedding_style?: string
  guest_count_range?: string
  duration_hours?: number
  items: TimelineTemplateItem[]
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface TimelineTemplateItem {
  time: string
  duration: number
  title: string
  type: TimelineType
  location?: string
  description?: string
}

// Analytics Types
export interface TaskAnalytics {
  couple_id: string
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  upcoming_week_tasks: number
  urgent_tasks: number
  critical_path_tasks: number
  blocked_tasks: number
  avg_completion_delay_days: number
  active_categories: number
  vendors_with_tasks: number
  avg_task_progress: number
}

export interface TimelineAnalytics {
  couple_id: string
  total_timeline_items: number
  confirmed_items: number
  vendor_items: number
  weather_dependent_items: number
  unique_locations: number
  earliest_start_time: string
  latest_end_time: string
  total_duration_minutes: number
  avg_buffer_time: number
  unresolved_conflicts: number
}

export interface MilestoneProgress {
  id: string
  couple_id: string
  title: string
  target_date: string
  status: MilestoneStatus
  type: MilestoneType
  total_tasks: number
  completed_tasks: number
  calculated_progress: number
  days_until_target: number
}

// Helper types for UI
export interface TaskWithDependencies extends Task {
  dependencies?: Task[]
  dependents?: Task[]
}

export interface TimelineItemWithVendor extends TimelineItem {
  vendor?: any // Replace with actual Vendor type
}

export interface MilestoneWithTasks extends Milestone {
  tasks?: Task[]
  timeline_items?: TimelineItem[]
}

// Filter and Sort Options
export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  category?: TaskCategory[]
  assigned_to?: TaskAssignment[]
  vendor_id?: string
  milestone_id?: string
  date_range?: {
    start: Date
    end: Date
  }
  search?: string
  show_completed?: boolean
  show_critical_path?: boolean
}

export interface TimelineFilters {
  type?: TimelineType[]
  vendor_id?: string
  milestone_id?: string
  confirmed?: boolean
  date?: Date
  location?: string
  search?: string
}

export type TaskSortField = 'due_date' | 'priority' | 'created_at' | 'title' | 'progress'
export type TimelineSortField = 'start_time' | 'type' | 'location' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface SortOptions<T> {
  field: T
  direction: SortDirection
}