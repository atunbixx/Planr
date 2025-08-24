import { z } from 'zod'

export const VendorDto = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  category: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  status: z.enum(['inquiry','shortlisted','quoted','booked','contracted','paid']).nullable().optional(),
  priceRange: z.string().optional(),
  contact: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  quoteamount: z.number().optional(),
  bookeddate: z.union([z.string(), z.date()]).optional(),
  instagramurl: z.string().optional(),
  logourl: z.string().optional(),
}).passthrough()

export const VendorListResponseDto = z.object({
  vendors: z.array(VendorDto),
  total: z.number().nullable().optional(),
  page: z.number().nullable().optional(),
  pageSize: z.number().nullable().optional(),
})
