import { z } from 'zod'

// Item returned by /api/vendors/directory
export const DirectoryVendorListItemDto = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().optional().nullable(),
  photos: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  priceBand: z.string().optional().nullable(),
  averageRating: z.number().optional().nullable(),
  reviewCount: z.number().optional().nullable(),
  featured: z.boolean().optional().nullable(),
})

export const DirectoryVendorListResponseDto = z.array(DirectoryVendorListItemDto)

export type DirectoryVendorListItem = z.infer<typeof DirectoryVendorListItemDto>
export type DirectoryVendorListResponse = z.infer<typeof DirectoryVendorListResponseDto>

