import { z } from 'zod'

/**
 * RSVP Validation Schemas
 * Following existing validation patterns in the application
 */

// RSVP submission schema for public RSVP endpoint
export const RSVPSubmissionSchema = z.object({
  inviteId: z.string().uuid('Invalid invite ID format'),
  email: z.string().email('Invalid email format').toLowerCase(),
  status: z.enum(['pending', 'accepted', 'declined'], {
    errorMap: () => ({ message: 'Status must be pending, accepted, or declined' })
  }),
  partySize: z.number()
    .int('Party size must be a whole number')
    .min(1, 'Party size must be at least 1')
    .max(10, 'Party size cannot exceed 10 guests')
    .default(1),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim() || undefined)
})

// Invite creation schema for authenticated users
export const InviteCreateSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  country: z.string()
    .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
    .toUpperCase()
    .optional(),
  notes: z.string()
    .max(200, 'Notes cannot exceed 200 characters')
    .optional()
    .transform(val => val?.trim() || undefined)
})

// Invite update schema
export const InviteUpdateSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().optional(),
  country: z.string()
    .length(2, 'Country code must be 2 characters')
    .toUpperCase()
    .optional(),
  notes: z.string()
    .max(200, 'Notes cannot exceed 200 characters')
    .optional()
    .transform(val => val?.trim() || undefined)
})

// RSVP filter schema for listing
export const RSVPFilterSchema = z.object({
  status: z.enum(['pending', 'accepted', 'declined']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
})

// Invite filter schema for listing
export const InviteFilterSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  search: z.string().max(100).optional()
})

// Bulk invite creation schema
export const BulkInviteCreateSchema = z.object({
  invites: z.array(InviteCreateSchema)
    .min(1, 'At least one invite is required')
    .max(50, 'Cannot create more than 50 invites at once')
})

// RSVP statistics response schema (for validation)
export const RSVPStatsSchema = z.object({
  total: z.number().int().min(0),
  pending: z.number().int().min(0),
  accepted: z.number().int().min(0),
  declined: z.number().int().min(0),
  totalGuests: z.number().int().min(0)
})

// Type exports for use in services
export type RSVPSubmissionData = z.infer<typeof RSVPSubmissionSchema>
export type InviteCreateData = z.infer<typeof InviteCreateSchema>
export type InviteUpdateData = z.infer<typeof InviteUpdateSchema>
export type RSVPFilterData = z.infer<typeof RSVPFilterSchema>
export type InviteFilterData = z.infer<typeof InviteFilterSchema>
export type BulkInviteCreateData = z.infer<typeof BulkInviteCreateSchema>
export type RSVPStatsData = z.infer<typeof RSVPStatsSchema>

// Validation helper functions
export function validateRSVPSubmission(data: unknown) {
  return RSVPSubmissionSchema.safeParse(data)
}

export function validateInviteCreate(data: unknown) {
  return InviteCreateSchema.safeParse(data)
}

export function validateInviteUpdate(data: unknown) {
  return InviteUpdateSchema.safeParse(data)
}

export function validateRSVPFilter(data: unknown) {
  return RSVPFilterSchema.safeParse(data)
}

export function validateInviteFilter(data: unknown) {
  return InviteFilterSchema.safeParse(data)
}

export function validateBulkInviteCreate(data: unknown) {
  return BulkInviteCreateSchema.safeParse(data)
}

// Email validation helper
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success
}

// Country code validation helper
export function isValidCountryCode(code: string): boolean {
  return z.string().length(2).safeParse(code).success
}

// Common validation error formatter
export function formatValidationErrors(errors: z.ZodError) {
  return errors.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }))
}