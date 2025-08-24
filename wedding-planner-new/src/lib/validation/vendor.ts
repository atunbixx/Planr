import { z } from 'zod'
import { normalizeCategory } from '@/lib/vendors/categories'

// Helpers to coerce numeric strings (with optional commas) to numbers
const numberFromString = z.preprocess((v) => {
  if (typeof v === 'string') {
    const t = v.trim()
    if (t === '') return undefined
    const n = Number(t.replace(/,/g, ''))
    return Number.isNaN(n) ? v : n
  }
  return v
}, z.number())

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').trim(),
  category: z
    .string()
    .min(1, 'Category is required')
    .transform((v) => normalizeCategory(v)),
  priceRange: z.string().optional(),
  contact: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  // Phase 2 optional fields (all optional to avoid breaking existing clients)
  status: z.enum(['inquiry', 'shortlisted', 'quoted', 'booked', 'contracted', 'paid']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isFavorite: z.boolean().optional(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000, 'Notes are too long').optional(),
  quoteAmount: numberFromString.optional(),
  bookedDate: z.string().datetime().optional(),
  instagramUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

export const updateVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').trim().optional(),
  category: z
    .string()
    .min(1, 'Category is required')
    .transform((v) => normalizeCategory(v))
    .optional(),
  priceRange: z.string().optional(),
  contact: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  status: z.enum(['inquiry', 'shortlisted', 'quoted', 'booked', 'contracted', 'paid']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isFavorite: z.boolean().optional(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000, 'Notes are too long').optional(),
  quoteAmount: numberFromString.optional(),
  bookedDate: z.string().datetime().optional(),
  instagramUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>
