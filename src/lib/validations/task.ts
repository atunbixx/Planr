import { z } from 'zod'

// Task form validation schema
export const taskFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  category: z.enum([
    'planning', 'venue', 'catering', 'photography', 'music', 
    'flowers', 'transportation', 'attire', 'beauty', 'honeymoon', 
    'legal', 'other'
  ], {
    required_error: 'Please select a category'
  }),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Please select a priority level'
  }),
  
  assigned_to: z.enum(['both', 'partner1', 'partner2', 'vendor'], {
    required_error: 'Please select who this task is assigned to'
  }),
  
  due_date: z.date({
    required_error: 'Due date is required'
  }).min(new Date(), 'Due date must be in the future'),
  
  estimated_duration_hours: z.number()
    .min(0.5, 'Duration must be at least 30 minutes')
    .max(168, 'Duration cannot exceed 1 week')
    .optional(),
  
  vendor_id: z.string().uuid().optional(),
  
  milestone_id: z.string().uuid().optional(),
  
  timeline_item_id: z.string().uuid().optional(),
  
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
  
  critical_path: z.boolean().optional(),
  
  recurring_pattern: z.enum([
    'daily', 'weekly', 'monthly', 'yearly'
  ]).optional(),
  
  recurring_end_date: z.date().optional(),
  
  weather_dependent: z.boolean().optional(),
  
  indoor_alternative: z.string()
    .max(500, 'Alternative description must be less than 500 characters')
    .optional(),
  
  contact_person: z.string()
    .max(200, 'Contact person name must be less than 200 characters')
    .optional(),
  
  contact_phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
  
  special_requirements: z.array(z.string())
    .max(10, 'Maximum 10 special requirements allowed')
    .optional()
}).refine((data) => {
  // If recurring pattern is set, recurring end date must be provided
  if (data.recurring_pattern && !data.recurring_end_date) {
    return false
  }
  return true
}, {
  message: 'Recurring end date is required when setting a recurring pattern',
  path: ['recurring_end_date']
}).refine((data) => {
  // If weather dependent is true, indoor alternative should be provided
  if (data.weather_dependent && !data.indoor_alternative) {
    return false
  }
  return true
}, {
  message: 'Indoor alternative is required for weather-dependent tasks',
  path: ['indoor_alternative']
})

// Task update schema (all fields optional)
export const taskUpdateSchema = taskFormSchema.partial()

// Task completion schema
export const taskCompletionSchema = z.object({
  completed: z.boolean(),
  notes: z.string()
    .max(1000, 'Completion notes must be less than 1000 characters')
    .optional()
})

// Task assignment schema
export const taskAssignmentSchema = z.object({
  assignedTo: z.string().uuid(),
  assignedBy: z.string().uuid(),
  notes: z.string()
    .max(500, 'Assignment notes must be less than 500 characters')
    .optional()
})

// Task comment schema
export const taskCommentSchema = z.object({
  comment: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
})

// Task dependency schema
export const taskDependencySchema = z.object({
  dependsOnId: z.string().uuid('Invalid task ID'),
  type: z.enum(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'], {
    required_error: 'Please select a dependency type'
  }),
  lagDays: z.number()
    .min(0, 'Lag days cannot be negative')
    .max(365, 'Lag days cannot exceed 1 year')
    .optional()
})

// Task filter schema
export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled', 'blocked']).optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.enum(['both', 'partner1', 'partner2', 'vendor']).optional(),
  vendorId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  criticalPath: z.boolean().optional(),
  dueDateFrom: z.date().optional(),
  dueDateTo: z.date().optional(),
  completed: z.boolean().optional(),
  tags: z.array(z.string()).optional()
})

// Bulk task operations schema
export const bulkTaskSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'At least one task must be selected'),
  updates: taskUpdateSchema
})

// Task template application schema
export const taskTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  weddingDate: z.date({
    required_error: 'Wedding date is required to apply template'
  }),
  customizations: z.object({
    adjustDates: z.boolean().default(true),
    includeSubtasks: z.boolean().default(true),
    assignToBoth: z.boolean().default(true)
  }).optional()
})

// Export types
export type TaskFormData = z.infer<typeof taskFormSchema>
export type TaskUpdateData = z.infer<typeof taskUpdateSchema>
export type TaskCompletionData = z.infer<typeof taskCompletionSchema>
export type TaskAssignmentData = z.infer<typeof taskAssignmentSchema>
export type TaskCommentData = z.infer<typeof taskCommentSchema>
export type TaskDependencyData = z.infer<typeof taskDependencySchema>
export type TaskFilterData = z.infer<typeof taskFilterSchema>
export type BulkTaskData = z.infer<typeof bulkTaskSchema>
export type TaskTemplateData = z.infer<typeof taskTemplateSchema> 