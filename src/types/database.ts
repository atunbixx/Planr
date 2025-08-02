// Re-export all generated types
export * from './database.generated'

// Additional custom types and interfaces
export type VendorCategory = 
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'florist'
  | 'music_dj'
  | 'band'
  | 'transportation'
  | 'beauty'
  | 'attire'
  | 'jewelry'
  | 'invitations'
  | 'decoration'
  | 'lighting'
  | 'rentals'
  | 'officiant'
  | 'planner'
  | 'cake'
  | 'entertainment'
  | 'security'
  | 'insurance'
  | 'other'

export type VendorStatus = 
  | 'researching'
  | 'contacted'
  | 'meeting_scheduled'
  | 'proposal_received'
  | 'quoted'
  | 'booked'
  | 'confirmed'
  | 'cancelled'

export type TaskStatus = 
  | 'todo'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type TaskPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export type RSVPStatus = 
  | 'pending'
  | 'attending'
  | 'not_attending'
  | 'maybe'
  | 'no_response'

export type GuestCategory = 
  | 'family'
  | 'friends'
  | 'wedding_party'
  | 'colleagues'
  | 'plus_ones'
  | 'children'
  | 'vendors'

export type GuestType = 
  | 'family'
  | 'friend'
  | 'colleague'
  | 'plus_one'
  | 'child'

// Type aliases for better DX
export type Database = import('./database.generated').Database
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Table type shortcuts
export type Couple = Tables['couples']['Row']
export type CoupleInsert = Tables['couples']['Insert']
export type CoupleUpdate = Tables['couples']['Update']

export type Vendor = Tables['couple_vendors']['Row']
export type VendorInsert = Tables['couple_vendors']['Insert']
export type VendorUpdate = Tables['couple_vendors']['Update']

// Guest types - using any for now as the table structure varies
export type Guest = any
export type GuestInsert = any
export type GuestUpdate = any

export type Task = Tables['tasks']['Row']
export type TaskInsert = Tables['tasks']['Insert']
export type TaskUpdate = Tables['tasks']['Update']

export type BudgetCategory = Tables['budget_categories']['Row']
export type BudgetCategoryInsert = Tables['budget_categories']['Insert']
export type BudgetCategoryUpdate = Tables['budget_categories']['Update']

export type BudgetItem = Tables['budget_items']['Row']
export type BudgetItemInsert = Tables['budget_items']['Insert']
export type BudgetItemUpdate = Tables['budget_items']['Update']

export type TimelineEvent = Tables['timeline_events']['Row']
export type TimelineEventInsert = Tables['timeline_events']['Insert']
export type TimelineEventUpdate = Tables['timeline_events']['Update']

export type ActivityFeed = Tables['activity_feed']['Row']
export type ActivityFeedInsert = Tables['activity_feed']['Insert']

// Helper types
export interface VendorWithExpenses extends Vendor {
  total_expenses?: number
  expense_count?: number
}

export interface GuestWithGroup extends Guest {
  group_members?: Guest[]
  group_size?: number
}

export interface TaskWithDependencies extends Task {
  dependencies?: Task[]
  dependents?: Task[]
}

export interface BudgetCategoryWithItems extends BudgetCategory {
  items?: BudgetItem[]
  total_allocated?: number
  total_spent?: number
}