/**
 * RSVP DTOs - Public RSVP response and invitation handling
 */

import { z } from 'zod'
import { PersonNameSchema, EmailSchema, DietaryRestrictionSchema } from '@/shared/validation/schemas'
import { RsvpStatus } from '@/shared/types/common'

// Public RSVP response schema (for invitation links)
export const PublicRsvpResponseSchema = z.object({
  invitationCode: z.string(),
  response: z.enum([
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE
  ]),
  ceremonyAttending: z.boolean().default(true),
  receptionAttending: z.boolean().default(true),
  
  // Meal preferences
  dietaryRestrictions: z.array(DietaryRestrictionSchema).default([]),
  mealChoice: z.string().max(100).optional(),
  allergies: z.string().max(500).optional(),
  
  // Plus one information
  plusOneName: PersonNameSchema.optional(),
  plusOneEmail: EmailSchema.optional(),
  plusOneDietaryRestrictions: z.array(DietaryRestrictionSchema).default([]),
  plusOneMealChoice: z.string().max(100).optional(),
  plusOneAllergies: z.string().max(500).optional(),
  
  // Additional information
  notes: z.string().max(1000).optional(),
  phoneNumber: z.string().optional(),
  
  // Accommodation requests
  needsAccommodation: z.boolean().default(false),
  accommodationNotes: z.string().max(500).optional(),
  
  // Transportation requests
  needsTransportation: z.boolean().default(false),
  transportationNotes: z.string().max(500).optional(),
  
  // Song requests or special messages
  songRequests: z.string().max(300).optional(),
  specialMessage: z.string().max(500).optional()
})

export type PublicRsvpResponse = z.infer<typeof PublicRsvpResponseSchema>

// RSVP invitation details (public view)
export const RsvpInvitationSchema = z.object({
  invitationCode: z.string(),
  guestName: z.string(),
  hasPlusOne: z.boolean(),
  weddingDate: z.string(), // ISO date
  weddingTime: z.string().optional(),
  ceremonyVenue: z.string(),
  receptionVenue: z.string().optional(),
  dressCode: z.string().optional(),
  rsvpDeadline: z.string().optional(), // ISO date
  currentRsvpStatus: z.enum([
    RsvpStatus.PENDING,
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE,
    RsvpStatus.CANCELLED
  ]),
  coupleNames: z.object({
    partner1: z.string(),
    partner2: z.string()
  }),
  mealOptions: z.array(z.string()).optional(),
  welcomeMessage: z.string().optional(),
  specialInstructions: z.string().optional()
})

export type RsvpInvitation = z.infer<typeof RsvpInvitationSchema>

// RSVP submission result
export const RsvpSubmissionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  invitationCode: z.string(),
  rsvpStatus: z.enum([
    RsvpStatus.CONFIRMED,
    RsvpStatus.DECLINED,
    RsvpStatus.MAYBE
  ]),
  submittedAt: z.string(), // ISO datetime
  confirmationNumber: z.string().optional(),
  nextSteps: z.array(z.string()).optional()
})

export type RsvpSubmissionResult = z.infer<typeof RsvpSubmissionResultSchema>

// RSVP reminder request
export const RsvpReminderRequestSchema = z.object({
  guestIds: z.array(z.string().uuid()).optional(), // If not provided, remind all pending
  reminderType: z.enum(['initial', 'first_reminder', 'final_reminder', 'custom']),
  customMessage: z.string().max(1000).optional(),
  sendDate: z.string().datetime().optional(), // Schedule for later
  includeWeddingDetails: z.boolean().default(true),
  includeVenueInfo: z.boolean().default(true),
  includeAccommodationInfo: z.boolean().default(false)
})

export type RsvpReminderRequest = z.infer<typeof RsvpReminderRequestSchema>

// RSVP tracking for couple dashboard
export const RsvpTrackingSchema = z.object({
  totalInvitations: z.number().int(),
  pendingResponses: z.number().int(),
  confirmedResponses: z.number().int(),
  declinedResponses: z.number().int(),
  maybeResponses: z.number().int(),
  responseRate: z.number(), // Percentage
  averageResponseTime: z.number().optional(), // Days
  rsvpDeadline: z.string().optional(), // ISO date
  daysUntilDeadline: z.number().optional(),
  remindersSent: z.number().int(),
  lastReminderSent: z.string().optional(), // ISO datetime
  nextReminderScheduled: z.string().optional() // ISO datetime
})

export type RsvpTracking = z.infer<typeof RsvpTrackingSchema>

// Invitation batch sending
export const SendInvitationBatchSchema = z.object({
  guestIds: z.array(z.string().uuid()),
  invitationType: z.enum(['save_the_date', 'formal_invitation', 'rsvp_reminder', 'custom']),
  sendMethod: z.enum(['email', 'sms', 'postal', 'all']),
  customSubject: z.string().max(200).optional(),
  customMessage: z.string().max(2000).optional(),
  scheduleDate: z.string().datetime().optional(), // Send immediately if not provided
  includeQrCode: z.boolean().default(true),
  includeWeddingWebsite: z.boolean().default(true),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true)
})

export type SendInvitationBatch = z.infer<typeof SendInvitationBatchSchema>

// Invitation template customization
export const InvitationTemplateSchema = z.object({
  templateType: z.enum(['save_the_date', 'formal_invitation', 'rsvp_reminder']),
  subject: z.string().max(200),
  headerMessage: z.string().max(500),
  bodyMessage: z.string().max(2000),
  footerMessage: z.string().max(500).optional(),
  includeWeddingDetails: z.boolean().default(true),
  includeVenueDetails: z.boolean().default(true),
  includeAccommodationInfo: z.boolean().default(false),
  includeRegistryInfo: z.boolean().default(false),
  backgroundColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logoUrl: z.string().url().optional()
})

export type InvitationTemplate = z.infer<typeof InvitationTemplateSchema>