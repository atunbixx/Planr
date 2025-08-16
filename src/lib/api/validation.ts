import { z } from 'zod'
import { smartNormalize } from '@/lib/utils/casing'

// Common schemas
export const IdSchema = z.string().uuid()
export const EmailSchema = z.string().email()
export const DateSchema = z.string().datetime()
export const CurrencySchema = z.string().length(3).default('NGN')

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

// Couple schemas
export const CoupleCreateSchema = z.object({
  email: EmailSchema.optional(),
  partner1Name: z.string().min(1, 'Partner 1 name is required'),
  partner2Name: z.string().optional(),
  weddingDate: DateSchema.optional(),
  venueName: z.string().optional(),
  venueLocation: z.string().optional(),
  guestCountEstimate: z.coerce.number().int().positive().optional(),
  totalBudget: z.coerce.number().positive().optional(),
  weddingStyle: z.enum(['traditional', 'modern', 'casual', 'destination', 'outdoor']).optional()
})

export const CoupleUpdateSchema = CoupleCreateSchema.partial()

// Vendor schemas
export const VendorCreateSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  contactName: z.string().optional(),
  email: EmailSchema.optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  category: z.string(),
  status: z.enum(['potential', 'contacted', 'quoted', 'booked', 'completed']).default('potential'),
  estimatedCost: z.coerce.number().positive().optional(),
  actualCost: z.coerce.number().positive().optional(),
  contractSigned: z.boolean().default(false),
  notes: z.string().optional()
})

export const VendorUpdateSchema = VendorCreateSchema.partial().extend({
  id: IdSchema
})

// Guest schemas
export const GuestCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: EmailSchema.optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().optional(),
  side: z.enum(['partner1', 'partner2', 'both']).optional(),
  plusOneAllowed: z.boolean().default(false),
  plusOneName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  notes: z.string().optional()
})

export const GuestUpdateSchema = GuestCreateSchema.partial().extend({
  id: IdSchema
})

// Budget schemas
export const BudgetCategoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().emoji().default('💰'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#667eea'),
  allocatedAmount: z.coerce.number().positive().default(0),
  priority: z.enum(['essential', 'important', 'nice-to-have']).default('important')
})

export const BudgetExpenseCreateSchema = z.object({
  categoryId: IdSchema,
  vendorId: IdSchema.optional(),
  vendorName: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive(),
  expenseType: z.enum(['estimated', 'actual']).default('actual'),
  paymentStatus: z.enum(['pending', 'paid', 'overdue']).default('pending'),
  paymentMethod: z.string().optional(),
  dueDate: DateSchema.optional(),
  paidDate: DateSchema.optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional()
})

// Helper function to validate request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json()
  const normalized = Array.isArray(body) ? body.map((v) => smartNormalize(v)) : (body && typeof body === 'object' ? smartNormalize(body as Record<string, any>) : body)
  return schema.parse(normalized)
}