import { z } from 'zod'

// Guest validation schemas
export const guestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.string().optional(),
  side: z.enum(['bride', 'groom', 'mutual']).optional(),
  plusOne: z.boolean().optional().default(false),
  dietaryNotes: z.string().optional(),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
  generateInvitationCode: z.boolean().optional().default(false)
})

export const rsvpSchema = z.object({
  rsvpStatus: z.enum(['confirmed', 'declined']),
  dietaryNotes: z.string().optional(),
  specialRequests: z.string().optional(),
  plusOneAttending: z.boolean().optional()
})

// Vendor validation schemas
export const vendorSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['potential', 'contacted', 'quoted', 'booked', 'completed']).optional().default('potential'),
  estimatedCost: z.number().positive('Cost must be positive').optional(),
  actualCost: z.number().positive('Cost must be positive').optional(),
  contractSigned: z.boolean().optional().default(false),
  notes: z.string().optional()
})

// Budget validation schemas
export const budgetCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  allocatedAmount: z.number().positive('Amount must be positive'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  color: z.string().optional(),
  icon: z.string().optional(),
  initializeDefaults: z.boolean().optional().default(false)
})

export const budgetExpenseSchema = z.object({
  name: z.string().min(1, 'Expense name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  vendorId: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  isPaid: z.boolean().optional().default(false)
})

// Checklist validation schemas
export const checklistItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  category: z.string().optional().default('Other'),
  timeframe: z.string().optional().default('1-3 months'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  dueDate: z.string().datetime().optional(),
  initializeDefaults: z.boolean().optional().default(false)
})

// Photo validation schemas
export const photoSchema = z.object({
  albumId: z.string().optional(),
  filename: z.string().min(1, 'Filename is required'),
  originalName: z.string().min(1, 'Original name is required'),
  cloudinaryId: z.string().min(1, 'Cloudinary ID is required'),
  url: z.string().url('Invalid URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  sortOrder: z.number().optional().default(0)
})

export const photoAlbumSchema = z.object({
  name: z.string().min(1, 'Album name is required').max(100),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
  sortOrder: z.number().optional().default(0)
})

// Validation utilities
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Sanitization utilities
export function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return value.trim() || undefined
}

export function sanitizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

export function sanitizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return false
}

// Pattern validation
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  url: /^https?:\/\/.+/,
  date: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
}

export function isValidEmail(email: string): boolean {
  return patterns.email.test(email)
}

export function isValidPhone(phone: string): boolean {
  return patterns.phone.test(phone)
}

export function isValidUUID(uuid: string): boolean {
  return patterns.uuid.test(uuid)
}

export function isValidURL(url: string): boolean {
  return patterns.url.test(url)
}

export function isValidDate(date: string): boolean {
  return patterns.date.test(date) && !isNaN(Date.parse(date))
}