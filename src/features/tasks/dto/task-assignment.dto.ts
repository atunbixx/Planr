import { z } from 'zod'

// Task assignment DTOs
export const AssignTaskDto = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  assigneeId: z.string().uuid('Invalid assignee ID'),
  assignedBy: z.string().uuid('Invalid assigner ID'),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional()
})

export const UnassignTaskDto = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  assigneeId: z.string().uuid('Invalid assignee ID'),
  unassignedBy: z.string().uuid('Invalid unassigner ID'),
  reason: z.string().optional()
})

export const BulkAssignTasksDto = z.object({
  taskIds: z.array(z.string().uuid('Invalid task ID')).min(1, 'At least one task ID required'),
  assigneeId: z.string().uuid('Invalid assignee ID'),
  assignedBy: z.string().uuid('Invalid assigner ID'),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional()
})

export const UpdateTaskAssignmentDto = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  assigneeId: z.string().uuid('Invalid assignee ID'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  updatedBy: z.string().uuid('Invalid updater ID')
})

export const TaskAssignmentFilterDto = z.object({
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
  assignedBy: z.string().uuid('Invalid assigner ID').optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().optional(),
  timeline: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
})

// Response DTOs
export const TaskAssignmentResponseDto = z.object({
  id: z.string(),
  taskId: z.string(),
  assigneeId: z.string(),
  assignedBy: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']),
  notes: z.string().nullable(),
  dueDate: z.date().nullable(),
  assignedAt: z.date(),
  updatedAt: z.date(),
  task: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    category: z.string().nullable(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    timeline: z.string().nullable(),
    order: z.number().nullable(),
    tags: z.array(z.string())
  }),
  assignee: z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(['couple', 'planner', 'vendor', 'admin']),
    isActive: z.boolean()
  }),
  assigner: z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(['couple', 'planner', 'vendor', 'admin']),
    isActive: z.boolean()
  })
})

export const TaskAssignmentStatsResponseDto = z.object({
  totalAssignments: z.number(),
  assignmentsByStatus: z.object({
    pending: z.number(),
    in_progress: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    on_hold: z.number()
  }),
  assignmentsByPriority: z.object({
    low: z.number(),
    medium: z.number(),
    high: z.number(),
    urgent: z.number()
  }),
  assignmentsByUser: z.array(z.object({
    userId: z.string(),
    userEmail: z.string(),
    userRole: z.enum(['couple', 'planner', 'vendor', 'admin']),
    totalAssigned: z.number(),
    completed: z.number(),
    pending: z.number(),
    overdue: z.number()
  })),
  overdueTasks: z.number(),
  completionRate: z.number(),
  averageCompletionTime: z.number().nullable()
})

export const UserTaskSummaryResponseDto = z.object({
  userId: z.string(),
  userEmail: z.string(),
  userRole: z.enum(['couple', 'planner', 'vendor', 'admin']),
  assignedTasks: z.array(TaskAssignmentResponseDto),
  stats: z.object({
    totalAssigned: z.number(),
    completed: z.number(),
    pending: z.number(),
    inProgress: z.number(),
    overdue: z.number(),
    completionRate: z.number()
  })
})

// Type exports
export type AssignTaskInput = z.infer<typeof AssignTaskDto>
export type UnassignTaskInput = z.infer<typeof UnassignTaskDto>
export type BulkAssignTasksInput = z.infer<typeof BulkAssignTasksDto>
export type UpdateTaskAssignmentInput = z.infer<typeof UpdateTaskAssignmentDto>
export type TaskAssignmentFilterInput = z.infer<typeof TaskAssignmentFilterDto>
export type TaskAssignmentResponse = z.infer<typeof TaskAssignmentResponseDto>
export type TaskAssignmentStatsResponse = z.infer<typeof TaskAssignmentStatsResponseDto>
export type UserTaskSummaryResponse = z.infer<typeof UserTaskSummaryResponseDto>

// User role utilities
export const USER_ROLES = {
  couple: 'Couple',
  planner: 'Wedding Planner',
  vendor: 'Vendor',
  admin: 'Administrator'
} as const

// Task assignment status utilities
export const ASSIGNMENT_STATUSES = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold'
} as const

// Assignment notification types
export const NOTIFICATION_TYPES = {
  task_assigned: 'Task Assigned',
  task_unassigned: 'Task Unassigned',
  task_updated: 'Task Updated',
  task_completed: 'Task Completed',
  task_overdue: 'Task Overdue',
  bulk_assigned: 'Bulk Tasks Assigned'
} as const

// Permission helpers
export const canAssignTasks = (userRole: string): boolean => {
  return ['couple', 'planner', 'admin'].includes(userRole)
}

export const canViewAllAssignments = (userRole: string): boolean => {
  return ['planner', 'admin'].includes(userRole)
}

export const canManageAssignments = (userRole: string): boolean => {
  return ['planner', 'admin'].includes(userRole)
}

// Default assignment settings
export const DEFAULT_ASSIGNMENT_SETTINGS = {
  autoNotify: true,
  allowSelfAssignment: true,
  requireDueDate: false,
  allowBulkAssignment: true,
  maxAssignmentsPerUser: 50
} as const