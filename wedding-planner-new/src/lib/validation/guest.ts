import { z } from 'zod'

export const createGuestSchema = z.object({
  name: z.string().min(1, 'Guest name is required').trim(),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined']).default('pending'),
  mealPreference: z.string().optional(),
  side: z.enum(['bride', 'groom']).optional(),
  invitationSent: z.boolean().default(false)
})

export const updateGuestSchema = z.object({
  name: z.string().min(1, 'Guest name is required').trim().optional(),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined']).optional(),
  mealPreference: z.string().optional(),
  side: z.enum(['bride', 'groom']).optional(),
  invitationSent: z.boolean().optional()
})

export const updateRsvpSchema = z.object({
  status: z.enum(['pending', 'accepted', 'declined']),
  dateResponded: z.string().datetime().optional()
})

export type CreateGuestInput = z.infer<typeof createGuestSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>
export type UpdateRsvpInput = z.infer<typeof updateRsvpSchema>