/**
 * Common Validation Schemas - Reusable Zod schemas
 */

import { z } from 'zod'
import { RsvpStatus, VendorStatus, PaymentStatus, Priority } from '@/shared/types/common'

// Base schemas
export const UuidSchema = z.string().uuid()
export const EmailSchema = z.string().email()
export const PhoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number')
export const UrlSchema = z.string().url()

// Date schemas
export const DateStringSchema = z.string().datetime()
export const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

// Currency and numbers
export const CurrencySchema = z.string().length(3, 'Currency must be 3 characters (e.g., USD)')
export const MoneyAmountSchema = z.number().min(0, 'Amount must be positive')
export const PercentageSchema = z.number().min(0).max(100, 'Percentage must be between 0 and 100')

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional()
})

// Sorting
export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// Filtering
export const FilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  dateFrom: DateStringSchema.optional(),
  dateTo: DateStringSchema.optional()
})

// Status enums as Zod schemas
export const RsvpStatusSchema = z.enum([
  RsvpStatus.PENDING,
  RsvpStatus.CONFIRMED,
  RsvpStatus.DECLINED,
  RsvpStatus.MAYBE,
  RsvpStatus.CANCELLED
])

export const VendorStatusSchema = z.enum([
  VendorStatus.POTENTIAL,
  VendorStatus.CONTACTED,
  VendorStatus.QUOTED,
  VendorStatus.BOOKED,
  VendorStatus.COMPLETED,
  VendorStatus.CANCELLED
])

export const PaymentStatusSchema = z.enum([
  PaymentStatus.PENDING,
  PaymentStatus.PAID,
  PaymentStatus.PARTIAL,
  PaymentStatus.OVERDUE,
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED
])

export const PrioritySchema = z.enum([
  Priority.LOW,
  Priority.MEDIUM,
  Priority.HIGH,
  Priority.URGENT
])

// Name validation
export const PersonNameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters')

// Address validation
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required')
})

// Dietary restrictions
export const DietaryRestrictionSchema = z.enum([
  'none',
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'halal',
  'kosher',
  'other'
])

// File upload
export const FileUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'), // 50MB max
  mimeType: z.string().min(1, 'MIME type is required'),
  url: UrlSchema.optional()
})

// Idempotency
export const IdempotencyKeySchema = z.string().uuid('Idempotency key must be a valid UUID')

/**
 * Create a schema for paginated requests
 */
export function createPaginatedSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) {
  return baseSchema.extend({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20)
  })
}

/**
 * Create a schema for sortable requests
 */
export function createSortableSchema<T extends z.ZodRawShape>(
  baseSchema: z.ZodObject<T>,
  allowedSortFields: string[]
) {
  return baseSchema.extend({
    sortBy: z.enum(allowedSortFields as [string, ...string[]]).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })
}