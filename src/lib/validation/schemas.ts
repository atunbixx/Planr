/**
 * Common Validation Schemas
 * Reusable Zod schemas for API input validation
 */

import { z } from 'zod';

// ============================================
// Common Field Schemas
// ============================================

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

export const dateSchema = z
  .string()
  .or(z.date())
  .transform((val) => new Date(val))
  .refine((date) => !isNaN(date.getTime()), 'Invalid date');

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .startsWith('https://', 'URL must use HTTPS');

export const currencySchema = z
  .number()
  .positive('Amount must be positive')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage must be at most 100');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// User & Authentication Schemas
// ============================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  phone: phoneSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phone: phoneSchema,
  preferences: z.record(z.any()).optional(),
});

// ============================================
// Wedding/Couple Schemas
// ============================================

export const createCoupleSchema = z.object({
  partner1Name: z.string().min(1).max(100).trim(),
  partner2Name: z.string().min(1).max(100).trim().optional(),
  weddingDate: dateSchema.optional(),
  venueName: z.string().max(200).trim().optional(),
  venueLocation: z.string().max(200).trim().optional(),
  guestCountEstimate: z.number().int().min(1).max(1000).optional(),
  totalBudget: currencySchema.optional(),
  currency: z.string().length(3).default('USD'),
  weddingStyle: z.enum(['traditional', 'modern', 'rustic', 'vintage', 'beach', 'garden']).optional(),
});

export const updateCoupleSchema = createCoupleSchema.partial();

// ============================================
// Guest Schemas
// ============================================

export const createGuestSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: z.string().max(500).trim().optional(),
  dietaryRestrictions: z.string().max(500).trim().optional(),
  notes: z.string().max(1000).trim().optional(),
  side: z.enum(['partner1', 'partner2', 'both']).default('both'),
  group: z.string().max(50).trim().optional(),
  tableNumber: z.string().max(20).optional(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe']).default('pending'),
  plusOne: z.boolean().default(false),
  plusOneName: z.string().max(100).trim().optional(),
  childrenCount: z.number().int().min(0).max(10).default(0),
});

export const updateGuestSchema = createGuestSchema.partial();

export const bulkUpdateGuestsSchema = z.object({
  guestIds: z.array(uuidSchema).min(1).max(100),
  updates: z.object({
    tableNumber: z.string().max(20).optional(),
    rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe']).optional(),
    group: z.string().max(50).optional(),
  }),
});

// ============================================
// Vendor Schemas
// ============================================

export const createVendorSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  category: z.string().min(1).max(50).trim(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  website: urlSchema.optional(),
  address: z.string().max(500).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  price: currencySchema.optional(),
  deposit: currencySchema.optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.enum(['researching', 'contacted', 'meeting_scheduled', 'proposal_received', 'hired', 'rejected']).default('researching'),
  notes: z.string().max(2000).trim().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

// ============================================
// Budget Schemas
// ============================================

export const createBudgetCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  allocatedAmount: currencySchema,
  description: z.string().max(500).trim().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
});

export const createBudgetExpenseSchema = z.object({
  categoryId: uuidSchema,
  vendorId: uuidSchema.optional(),
  description: z.string().min(1).max(500).trim(),
  amount: currencySchema,
  paidAmount: currencySchema.default(0),
  dueDate: dateSchema.optional(),
  isPaid: z.boolean().default(false),
  paymentMethod: z.enum(['cash', 'credit', 'debit', 'check', 'transfer', 'other']).optional(),
  notes: z.string().max(1000).trim().optional(),
});

export const updateBudgetExpenseSchema = createBudgetExpenseSchema.partial();

// ============================================
// Message/Communication Schemas
// ============================================

export const sendMessageSchema = z.object({
  recipientIds: z.array(uuidSchema).min(1).max(100),
  subject: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(5000).trim(),
  templateId: uuidSchema.optional(),
  channel: z.enum(['email', 'sms', 'whatsapp']).default('email'),
  scheduledFor: dateSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export const createMessageTemplateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  category: z.enum(['invitation', 'reminder', 'update', 'thank_you', 'custom']),
  subject: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(5000).trim(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// ============================================
// Photo/Media Schemas
// ============================================

export const createPhotoAlbumSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  isPublic: z.boolean().default(false),
  coverPhotoId: uuidSchema.optional(),
});

export const uploadPhotoSchema = z.object({
  albumId: uuidSchema,
  caption: z.string().max(500).trim().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPublic: z.boolean().default(false),
});

// ============================================
// Timeline/Event Schemas
// ============================================

export const createTimelineEventSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  startTime: dateSchema,
  endTime: dateSchema.optional(),
  location: z.string().max(200).trim().optional(),
  category: z.enum(['ceremony', 'reception', 'preparation', 'photo', 'transport', 'other']),
  isPublic: z.boolean().default(true),
  notifyGuests: z.boolean().default(false),
  reminderMinutes: z.number().int().min(0).max(1440).optional(),
});

export const updateTimelineEventSchema = createTimelineEventSchema.partial();

// ============================================
// Seating/Table Schemas
// ============================================

export const createTableSchema = z.object({
  number: z.string().min(1).max(20).trim(),
  name: z.string().max(100).trim().optional(),
  capacity: z.number().int().min(1).max(50),
  shape: z.enum(['round', 'rectangle', 'square', 'oval']).default('round'),
  location: z.string().max(100).trim().optional(),
  notes: z.string().max(500).trim().optional(),
});

export const assignSeatingSchema = z.object({
  tableId: uuidSchema,
  guestIds: z.array(uuidSchema).min(1).max(50),
  removeExisting: z.boolean().default(false),
});

// ============================================
// RSVP Schemas
// ============================================

export const rsvpResponseSchema = z.object({
  invitationCode: z.string().min(1).max(50).trim(),
  attending: z.enum(['yes', 'no', 'maybe']),
  guestCount: z.number().int().min(0).max(10).default(1),
  dietaryRestrictions: z.string().max(500).trim().optional(),
  notes: z.string().max(1000).trim().optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
});

// ============================================
// Search/Filter Schemas
// ============================================

export const searchSchema = z.object({
  query: z.string().min(1).max(100).trim(),
  filters: z.record(z.any()).optional(),
  ...paginationSchema.shape,
});

export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine(data => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
});

// ============================================
// File Upload Schemas
// ============================================

export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.string(),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
});

export const documentUploadSchema = fileUploadSchema.extend({
  mimetype: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ]),
  category: z.enum(['contract', 'invoice', 'proposal', 'other']),
  vendorId: uuidSchema.optional(),
});

export const imageUploadSchema = fileUploadSchema.extend({
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  size: z.number().positive().max(5 * 1024 * 1024), // 5MB max for images
});

// ============================================
// Validation Helpers
// ============================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function sanitizeInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  const result = validateInput(schema, data);
  return result.success ? result.data : null;
}