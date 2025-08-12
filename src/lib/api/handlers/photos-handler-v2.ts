import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler, NotFoundException, BadRequestException } from '../base-handler'
import { prisma } from '@/lib/prisma'
import { toApiFormat, toDbFormat } from '@/lib/db/transformations'

// Validation schemas
const createPhotoSchema = z.object({
  albumId: z.string().uuid(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    size: z.number().optional(),
    mimeType: z.string().optional()
  }).optional(),
  takenAt: z.string().optional(),
  uploadedBy: z.string().optional(),
  isFavorite: z.boolean().default(false),
  isPrivate: z.boolean().default(false)
})

const updatePhotoSchema = createPhotoSchema.partial().omit({ albumId: true, url: true })

const createAlbumSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coverPhotoId: z.string().uuid().optional(),
  isPrivate: z.boolean().default(false),
  shareToken: z.string().optional(),
  tags: z.array(z.string()).default([])
})

const updateAlbumSchema = createAlbumSchema.partial()

export class PhotosHandlerV2 extends BaseApiHandler {
  protected model = 'Photo' as const
  
  // Photo methods
  async listPhotos(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const albumId = url.searchParams.get('albumId')
      const tags = url.searchParams.get('tags')?.split(',').filter(Boolean)
      const isFavorite = url.searchParams.get('isFavorite')
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      
      let whereClause: any = { couple_id: coupleId }
      
      if (albumId) whereClause.album_id = albumId
      if (isFavorite !== null) whereClause.is_favorite = isFavorite === 'true'
      if (tags && tags.length > 0) {
        whereClause.tags = { hasSome: tags }
      }
      
      const skip = (page - 1) * limit
      
      const [photos, total] = await Promise.all([
        prisma.photos.findMany({
          where: whereClause,
          orderBy: [
            { is_favorite: 'desc' },
            { taken_at: 'desc' },
            { created_at: 'desc' }
          ],
          skip,
          take: limit,
          include: {
            albums: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        prisma.photos.count({ where: whereClause })
      ])
      
      return {
        photos: photos.map(photo => ({
          ...toApiFormat(photo, 'Photo'),
          album: photo.albums ? {
            id: photo.albums.id,
            name: photo.albums.name
          } : null
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  }
  
  async createPhoto(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createPhotoSchema)
      
      // Verify album belongs to this couple
      const album = await prisma.albums.findFirst({
        where: {
          id: data.albumId,
          couple_id: coupleId
        }
      })
      
      if (!album) {
        throw new NotFoundException('Album not found')
      }
      
      // Transform to database format
      const dbData = toDbFormat({
        ...data,
        coupleId
      }, 'Photo')
      
      const photo = await prisma.photos.create({
        data: {
          couple_id: coupleId,
          album_id: dbData.albumId,
          url: dbData.url,
          thumbnail_url: dbData.thumbnailUrl,
          caption: dbData.caption,
          tags: dbData.tags,
          metadata: dbData.metadata,
          taken_at: dbData.takenAt ? new Date(dbData.takenAt) : null,
          uploaded_by: dbData.uploadedBy,
          is_favorite: dbData.isFavorite,
          is_private: dbData.isPrivate,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      
      // Update album photo count
      await prisma.albums.update({
        where: { id: data.albumId },
        data: {
          photo_count: {
            increment: 1
          },
          updated_at: new Date()
        }
      })
      
      return toApiFormat(photo, 'Photo')
    })
  }
  
  async updatePhoto(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updatePhotoSchema)
      
      // Check if photo belongs to this couple
      const existingPhoto = await prisma.photos.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingPhoto) {
        throw new NotFoundException('Photo not found')
      }
      
      // Transform to database format
      const dbData = toDbFormat(data, 'Photo')
      
      const updatedPhoto = await prisma.photos.update({
        where: { id },
        data: {
          caption: dbData.caption,
          tags: dbData.tags,
          metadata: dbData.metadata,
          taken_at: dbData.takenAt ? new Date(dbData.takenAt) : undefined,
          is_favorite: dbData.isFavorite,
          is_private: dbData.isPrivate,
          updated_at: new Date()
        }
      })
      
      return toApiFormat(updatedPhoto, 'Photo')
    })
  }
  
  async deletePhoto(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if photo belongs to this couple
      const existingPhoto = await prisma.photos.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingPhoto) {
        throw new NotFoundException('Photo not found')
      }
      
      // Delete photo and update album count
      await prisma.$transaction(async (tx) => {
        await tx.photos.delete({
          where: { id }
        })
        
        await tx.albums.update({
          where: { id: existingPhoto.album_id },
          data: {
            photo_count: {
              decrement: 1
            },
            updated_at: new Date()
          }
        })
      })
      
      return { success: true }
    })
  }
  
  // Album methods
  async listAlbums(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const albums = await prisma.albums.findMany({
        where: { couple_id: coupleId },
        orderBy: { created_at: 'desc' },
        include: {
          photos: {
            select: {
              id: true,
              url: true,
              thumbnail_url: true
            },
            where: {
              is_private: false
            },
            orderBy: {
              created_at: 'desc'
            },
            take: 1
          }
        }
      })
      
      return albums.map(album => ({
        ...toApiFormat(album, 'Album'),
        coverPhoto: album.photos[0] ? {
          id: album.photos[0].id,
          url: album.photos[0].url,
          thumbnailUrl: album.photos[0].thumbnail_url
        } : null
      }))
    })
  }
  
  async createAlbum(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createAlbumSchema)
      
      // Transform to database format
      const dbData = toDbFormat({
        ...data,
        coupleId
      }, 'Album')
      
      const album = await prisma.albums.create({
        data: {
          couple_id: coupleId,
          name: dbData.name,
          description: dbData.description,
          cover_photo_id: dbData.coverPhotoId,
          is_private: dbData.isPrivate,
          share_token: dbData.shareToken || crypto.randomBytes(16).toString('hex'),
          tags: dbData.tags,
          photo_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      
      return toApiFormat(album, 'Album')
    })
  }
  
  async getAlbum(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const album = await prisma.albums.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        },
        include: {
          photos: {
            orderBy: [
              { is_favorite: 'desc' },
              { taken_at: 'desc' },
              { created_at: 'desc' }
            ]
          }
        }
      })
      
      if (!album) {
        throw new NotFoundException('Album not found')
      }
      
      return {
        ...toApiFormat(album, 'Album'),
        photos: album.photos.map(photo => toApiFormat(photo, 'Photo'))
      }
    })
  }
  
  async updateAlbum(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateAlbumSchema)
      
      // Check if album belongs to this couple
      const existingAlbum = await prisma.albums.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingAlbum) {
        throw new NotFoundException('Album not found')
      }
      
      // Transform to database format
      const dbData = toDbFormat(data, 'Album')
      
      const updatedAlbum = await prisma.albums.update({
        where: { id },
        data: {
          name: dbData.name,
          description: dbData.description,
          cover_photo_id: dbData.coverPhotoId,
          is_private: dbData.isPrivate,
          tags: dbData.tags,
          updated_at: new Date()
        }
      })
      
      return toApiFormat(updatedAlbum, 'Album')
    })
  }
  
  async deleteAlbum(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if album belongs to this couple
      const existingAlbum = await prisma.albums.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingAlbum) {
        throw new NotFoundException('Album not found')
      }
      
      // Check if album has photos
      const photoCount = await prisma.photos.count({
        where: { album_id: id }
      })
      
      if (photoCount > 0) {
        throw new BadRequestException('Cannot delete album with photos. Please delete all photos first.')
      }
      
      await prisma.albums.delete({
        where: { id }
      })
      
      return { success: true }
    })
  }
  
  // Bulk operations
  async bulkToggleFavorite(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const { photoIds, isFavorite } = await request.json()
      
      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        throw new BadRequestException('Invalid photo IDs')
      }
      
      // Verify all photos belong to this couple
      const photos = await prisma.photos.findMany({
        where: {
          id: { in: photoIds },
          couple_id: coupleId
        }
      })
      
      if (photos.length !== photoIds.length) {
        throw new NotFoundException('One or more photos not found')
      }
      
      // Update all photos
      await prisma.photos.updateMany({
        where: {
          id: { in: photoIds },
          couple_id: coupleId
        },
        data: {
          is_favorite: isFavorite,
          updated_at: new Date()
        }
      })
      
      return { success: true, count: photoIds.length }
    })
  }
}

// Import crypto for share token generation
import crypto from 'crypto'