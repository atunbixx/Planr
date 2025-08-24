import { z } from 'zod'

// Input DTOs for guest operations
export const CreateGuestDto = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().trim().optional(), // Last name is now optional
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  side: z.enum(['bride', 'groom']).optional(),
  plusOneAllowed: z.boolean().default(false),
  plusOneName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  attendingCount: z.number().int().min(0).default(1),
  rsvpDeadline: z.string().datetime().optional(),
  relationshipCategory: z.enum(['sibling','parent','relative','friend','neighbour','colleague','vendor','other']).optional()
})

export const UpdateGuestDto = z.object({
  firstName: z.string().min(1, 'First name is required').trim().optional(),
  lastName: z.string().trim().optional(), // Last name is optional
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  side: z.enum(['bride', 'groom']).optional(),
  plusOneAllowed: z.boolean().optional(),
  plusOneName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  attendingCount: z.number().int().min(0).optional(),
  rsvpDeadline: z.string().datetime().optional(),
  relationshipCategory: z.enum(['sibling','parent','relative','friend','neighbour','colleague','vendor','other']).optional()
})

export const GuestFilterDto = z.object({
  side: z.enum(['bride', 'groom']).optional(),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined']).optional(),
  dietary: z.string().optional(),
  category: z.enum(['sibling','parent','relative','friend','neighbour','colleague','vendor','other']).optional(),
  plusOneAllowed: z.boolean().optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
})

// Response DTOs
export const GuestResponseDto = z.object({
  id: z.string(),
  coupleId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  relationshipCategory: z.enum(['sibling','parent','relative','friend','neighbour','colleague','vendor','other']).optional(),
  side: z.enum(['bride', 'groom']).optional(),
  plusOneAllowed: z.boolean(),
  plusOneName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  notes: z.string().optional(),
  attendingCount: z.number(),
  invitationSentAt: z.date().optional(),
  rsvpDeadline: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const GuestListResponseDto = z.object({
  guests: z.array(GuestResponseDto),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
})

// Type exports
export type CreateGuestInput = z.infer<typeof CreateGuestDto>
export type UpdateGuestInput = z.infer<typeof UpdateGuestDto>
export type GuestFilterInput = z.infer<typeof GuestFilterDto>
export type GuestResponse = z.infer<typeof GuestResponseDto>
export type GuestListResponse = z.infer<typeof GuestListResponseDto>
