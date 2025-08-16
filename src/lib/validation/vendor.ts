import { z } from 'zod'

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  priceRange: z.string().optional(),
  contact: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal(''))
})

export const updateVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').trim().optional(),
  category: z.string().min(1, 'Category is required').trim().optional(),
  priceRange: z.string().optional(),
  contact: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal(''))
})

export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>