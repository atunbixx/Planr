import { z } from 'zod'

export const CreatePhotoDto = z.object({
  url: z.string().url('Valid image URL is required'),
  alt: z.string().optional(),
  caption: z.string().optional(),
  albumId: z.string().uuid().optional().nullable(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  size: z.number().int().positive().optional(),
  order: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
  metadata: z.any().optional(),
})

export const UpdatePhotoDto = z.object({
  url: z.string().url().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  albumId: z.string().uuid().nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  size: z.number().int().positive().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
  metadata: z.any().optional(),
})

export const PhotoFilterDto = z.object({
  albumId: z.string().uuid().optional(),
  q: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const PhotoResponseDto = z.object({
  id: z.string(),
  userId: z.string(),
  albumId: z.string().nullable().optional(),
  url: z.string(),
  alt: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  size: z.number().nullable().optional(),
  order: z.number(),
  isPrimary: z.boolean(),
  metadata: z.any().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
})

export const PhotoListResponseDto = z.object({
  photos: z.array(PhotoResponseDto),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

// Albums
export const CreateAlbumDto = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export const UpdateAlbumDto = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  coverPhotoId: z.string().uuid().nullable().optional(),
})

export const AlbumResponseDto = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  coverPhotoId: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
})

export const AlbumListResponseDto = z.object({
  albums: z.array(AlbumResponseDto),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export type CreatePhotoInput = z.infer<typeof CreatePhotoDto>
export type UpdatePhotoInput = z.infer<typeof UpdatePhotoDto>
export type PhotoFilterInput = z.infer<typeof PhotoFilterDto>
export type PhotoResponse = z.infer<typeof PhotoResponseDto>
export type PhotoListResponse = z.infer<typeof PhotoListResponseDto>

export type CreateAlbumInput = z.infer<typeof CreateAlbumDto>
export type UpdateAlbumInput = z.infer<typeof UpdateAlbumDto>
export type AlbumResponse = z.infer<typeof AlbumResponseDto>
export type AlbumListResponse = z.infer<typeof AlbumListResponseDto>

