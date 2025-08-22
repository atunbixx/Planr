import { z } from 'zod'

// Input DTOs
export const CreateTaskDto = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).default('pending'),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  timeline: z.string().optional(),
  order: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional()
})

export const UpdateTaskDto = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
  dueDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  timeline: z.string().optional(),
  order: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
})

export const TaskFilterDto = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  timeline: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  includeCompleted: z.boolean().default(true)
})

// Output DTOs
export const TaskResponseDto = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']),
  dueDate: z.date().nullable(),
  completedAt: z.date().nullable(),
  assignedTo: z.string().nullable(),
  isTemplate: z.boolean(),
  templateId: z.string().nullable(),
  timeline: z.string().nullable(),
  order: z.number().int().nullable(),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const TaskListResponseDto = z.object({
  tasks: z.array(TaskResponseDto),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
})

export const TaskStatsResponseDto = z.object({
  total: z.number(),
  pending: z.number(),
  in_progress: z.number(),
  completed: z.number(),
  overdue: z.number(),
  completedThisWeek: z.number()
})

// Type exports
export type CreateTaskInput = z.infer<typeof CreateTaskDto>
export type UpdateTaskInput = z.infer<typeof UpdateTaskDto>
export type TaskFilterInput = z.infer<typeof TaskFilterDto>
export type TaskResponse = z.infer<typeof TaskResponseDto>
export type TaskListResponse = z.infer<typeof TaskListResponseDto>
export type TaskStatsResponse = z.infer<typeof TaskStatsResponseDto>

// Template task data
export const WEDDING_TASK_TEMPLATES = {
  '12_months': [
    {
      title: 'Set Wedding Date',
      description: 'Choose your wedding date and book the venue',
      category: 'Planning',
      priority: 'high' as const,
      timeline: '12_months',
      order: 1,
      tags: ['venue', 'date']
    },
    {
      title: 'Create Guest List Draft',
      description: 'Start creating your initial guest list',
      category: 'Guests',
      priority: 'high' as const,
      timeline: '12_months',
      order: 2,
      tags: ['guests', 'planning']
    },
    {
      title: 'Set Wedding Budget',
      description: 'Determine your overall wedding budget',
      category: 'Budget',
      priority: 'high' as const,
      timeline: '12_months',
      order: 3,
      tags: ['budget', 'planning']
    },
    {
      title: 'Research Venues',
      description: 'Research and visit potential wedding venues',
      category: 'Venue',
      priority: 'high' as const,
      timeline: '12_months',
      order: 4,
      tags: ['venue', 'research']
    },
    {
      title: 'Book Photographer',
      description: 'Research and book your wedding photographer',
      category: 'Photography',
      priority: 'medium' as const,
      timeline: '12_months',
      order: 5,
      tags: ['photography', 'vendor']
    }
  ],
  '6_months': [
    {
      title: 'Send Save the Dates',
      description: 'Design and send save the date cards',
      category: 'Invitations',
      priority: 'high' as const,
      timeline: '6_months',
      order: 1,
      tags: ['invitations', 'guests']
    },
    {
      title: 'Book Catering',
      description: 'Finalize catering and menu selection',
      category: 'Catering',
      priority: 'high' as const,
      timeline: '6_months',
      order: 2,
      tags: ['catering', 'food']
    },
    {
      title: 'Order Wedding Dress',
      description: 'Order your wedding dress and schedule fittings',
      category: 'Attire',
      priority: 'high' as const,
      timeline: '6_months',
      order: 3,
      tags: ['dress', 'attire']
    },
    {
      title: 'Book Music/DJ',
      description: 'Book band or DJ for ceremony and reception',
      category: 'Music',
      priority: 'medium' as const,
      timeline: '6_months',
      order: 4,
      tags: ['music', 'entertainment']
    },
    {
      title: 'Plan Honeymoon',
      description: 'Research and book honeymoon destination',
      category: 'Honeymoon',
      priority: 'medium' as const,
      timeline: '6_months',
      order: 5,
      tags: ['honeymoon', 'travel']
    }
  ],
  '3_months': [
    {
      title: 'Send Wedding Invitations',
      description: 'Send formal wedding invitations to guests',
      category: 'Invitations',
      priority: 'high' as const,
      timeline: '3_months',
      order: 1,
      tags: ['invitations', 'guests']
    },
    {
      title: 'Finalize Guest Count',
      description: 'Get final RSVP count and update vendors',
      category: 'Guests',
      priority: 'high' as const,
      timeline: '3_months',
      order: 2,
      tags: ['guests', 'rsvp']
    },
    {
      title: 'Order Wedding Cake',
      description: 'Order wedding cake and arrange tasting',
      category: 'Catering',
      priority: 'medium' as const,
      timeline: '3_months',
      order: 3,
      tags: ['cake', 'dessert']
    },
    {
      title: 'Book Transportation',
      description: 'Arrange transportation for wedding day',
      category: 'Transportation',
      priority: 'medium' as const,
      timeline: '3_months',
      order: 4,
      tags: ['transportation', 'logistics']
    },
    {
      title: 'Plan Rehearsal Dinner',
      description: 'Plan and book rehearsal dinner venue',
      category: 'Events',
      priority: 'medium' as const,
      timeline: '3_months',
      order: 5,
      tags: ['rehearsal', 'dinner']
    }
  ],
  '1_month': [
    {
      title: 'Final Dress Fitting',
      description: 'Complete final dress fitting and alterations',
      category: 'Attire',
      priority: 'high' as const,
      timeline: '1_month',
      order: 1,
      tags: ['dress', 'fitting']
    },
    {
      title: 'Confirm All Vendors',
      description: 'Confirm details with all wedding vendors',
      category: 'Vendors',
      priority: 'high' as const,
      timeline: '1_month',
      order: 2,
      tags: ['vendors', 'confirmation']
    },
    {
      title: 'Create Seating Chart',
      description: 'Finalize seating arrangements for reception',
      category: 'Planning',
      priority: 'high' as const,
      timeline: '1_month',
      order: 3,
      tags: ['seating', 'guests']
    },
    {
      title: 'Prepare Wedding Timeline',
      description: 'Create detailed timeline for wedding day',
      category: 'Planning',
      priority: 'high' as const,
      timeline: '1_month',
      order: 4,
      tags: ['timeline', 'schedule']
    },
    {
      title: 'Pack for Honeymoon',
      description: 'Pack and prepare for honeymoon trip',
      category: 'Honeymoon',
      priority: 'medium' as const,
      timeline: '1_month',
      order: 5,
      tags: ['honeymoon', 'packing']
    }
  ],
  '1_week': [
    {
      title: 'Confirm Guest Count with Venue',
      description: 'Provide final guest count to venue and caterer',
      category: 'Venue',
      priority: 'high' as const,
      timeline: '1_week',
      order: 1,
      tags: ['venue', 'guests', 'final']
    },
    {
      title: 'Prepare Wedding Day Emergency Kit',
      description: 'Pack emergency kit with essentials for wedding day',
      category: 'Preparation',
      priority: 'medium' as const,
      timeline: '1_week',
      order: 2,
      tags: ['emergency', 'preparation']
    },
    {
      title: 'Rehearsal and Rehearsal Dinner',
      description: 'Attend wedding rehearsal and rehearsal dinner',
      category: 'Events',
      priority: 'high' as const,
      timeline: '1_week',
      order: 3,
      tags: ['rehearsal', 'practice']
    },
    {
      title: 'Prepare Wedding Day Schedule',
      description: 'Distribute timeline to wedding party and vendors',
      category: 'Planning',
      priority: 'high' as const,
      timeline: '1_week',
      order: 4,
      tags: ['schedule', 'coordination']
    },
    {
      title: 'Relax and Rest',
      description: 'Take time to relax before your big day',
      category: 'Self-Care',
      priority: 'medium' as const,
      timeline: '1_week',
      order: 5,
      tags: ['relaxation', 'self-care']
    }
  ]
}