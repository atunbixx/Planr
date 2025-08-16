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
      
      let whereClause: any = { coupleId }
      
      if (albumId) whereClause.albumId = albumId
      if (isFavorite !== null) whereClause.isFavorite = isFavorite === 'true'
      if (tags && tags.length > 0) {
        whereClause.tags = { hasSome: tags }
      }
      
      const skip = (page - 1) * limit
      
      const [photos, total] = await Promise.all([
        prisma.photo.findMany({
          where: whereClause,
          orderBy: [
            { isFavorite: 'desc' },
            { photoDate: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit,
          include: {
            photoAlbum: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        prisma.photo.count({ where: whereClause })
      ])
      
      return {
        photos: photos.map(photo => ({
          ...toApiFormat(photo, 'Photo'),
          album: photo.photoAlbum ? {
            id: photo.photoAlbum.id,
            name: photo.photoAlbum.name
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
      const album = await prisma.photoAlbum.findFirst({
        where: {
          id: data.albumId,
          coupleId
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
      
      const photo = await prisma.photo.create({
        data: {
          coupleId,
          albumId: dbData.albumId,
          imageUrl: dbData.url,
          caption: dbData.caption,
          tags: dbData.tags,
          photoDate: dbData.takenAt ? new Date(dbData.takenAt) : null,
          uploadedBy: dbData.uploadedBy,
          isFavorite: dbData.isFavorite,
          isPrivate: dbData.isPrivate,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      // Update album's updated timestamp
      await prisma.photoAlbum.update({
        where: { id: data.albumId },
        data: {
          updatedAt: new Date()
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
      const existingPhoto = await prisma.photo.findFirst({
        where: {
          id: id,
          coupleId
        }
      })
      
      if (!existingPhoto) {
        throw new NotFoundException('Photo not found')
      }
      
      // Transform to database format
      const dbData = toDbFormat(data, 'Photo')
      
      const updatedPhoto = await prisma.photo.update({
        where: { id },
        data: {
          caption: dbData.caption,
          tags: dbData.tags,
          photoDate: dbData.takenAt ? new Date(dbData.takenAt) : undefined,
          isFavorite: dbData.isFavorite,
          isPrivate: dbData.isPrivate,
          updatedAt: new Date()
        }
      })
      
      return toApiFormat(updatedPhoto, 'Photo')
    })
  }
  
  async deletePhoto(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if photo belongs to this couple
      const existingPhoto = await prisma.photo.findFirst({
        where: {
          id: id,
          coupleId
        }
      })
      
      if (!existingPhoto) {
        throw new NotFoundException('Photo not found')
      }
      
      // Delete photo and update album count
      await prisma.$transaction(async (tx) => {
        await tx.photo.delete({
          where: { id }
        })
        
        await tx.photoAlbum.update({
          where: { id: existingPhoto.albumId },
          data: {
            photoCount: {
              decrement: 1
            },
            updatedAt: new Date()
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
      
      const albums = await prisma.photoAlbum.findMany({
        where: { coupleId },
        orderBy: { createdAt: 'desc' as const },
        include: {
          photos: {
            select: {
              id: true,
              imageUrl: true
            },
            where: {
              isPrivate: false
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      })
      
      return albums.map(album => ({
        ...toApiFormat(album, 'Album'),
        coverPhoto: album.photos[0] ? {
          id: album.photos[0].id,
          url: album.photos[0].imageUrl
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
      
      const album = await prisma.photoAlbum.create({
        data: {
          coupleId,
          name: dbData.name,
          description: dbData.description,
          coverPhotoId: dbData.coverPhotoId,
          isPrivate: dbData.isPrivate,
          shareToken: dbData.shareToken || crypto.randomBytes(16).toString('hex'),
          tags: dbData.tags,
          photoCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      return toApiFormat(album, 'Album')
    })
  }
  
  async getAlbum(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const album = await prisma.photoAlbum.findFirst({
        where: {
          id: id,
          coupleId
        },
        include: {
          photos: {
            orderBy: [
              { isFavorite: 'desc' },
              { photoDate: 'desc' },
              { createdAt: 'desc' }
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
      const existingAlbum = await prisma.photoAlbum.findFirst({
        where: {
          id: id,
          coupleId
        }
      })
      
      if (!existingAlbum) {
        throw new NotFoundException('Album not found')
      }
      
      // Transform to database format
      const dbData = toDbFormat(data, 'Album')
      
      const updatedAlbum = await prisma.photoAlbum.update({
        where: { id },
        data: {
          name: dbData.name,
          description: dbData.description,
          coverPhotoId: dbData.coverPhotoId,
          isPrivate: dbData.isPrivate,
          tags: dbData.tags,
          updatedAt: new Date()
        }
      })
      
      return toApiFormat(updatedAlbum, 'Album')
    })
  }
  
  async deleteAlbum(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if album belongs to this couple
      const existingAlbum = await prisma.photoAlbum.findFirst({
        where: {
          id: id,
          coupleId
        }
      })
      
      if (!existingAlbum) {
        throw new NotFoundException('Album not found')
      }
      
      // Check if album has photos
      const photoCount = await prisma.photo.count({
        where: { albumId: id }
      })
      
      if (photoCount > 0) {
        throw new BadRequestException('Cannot delete album with photos. Please delete all photos first.')
      }
      
      await prisma.photoAlbum.delete({
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
      const photos = await prisma.photo.findMany({
        where: {
          id: { in: photoIds },
          coupleId
        }
      })
      
      if (photos.length !== photoIds.length) {
        throw new NotFoundException('One or more photos not found')
      }
      
      // Update all photos
      await prisma.photo.updateMany({
        where: {
          id: { in: photoIds },
          coupleId
        },
        data: {
          isFavorite: isFavorite,
          updatedAt: new Date()
        }
      })
      
      return { success: true, count: photoIds.length }
    })
  }
}

// Import crypto for share token generation
import crypto from 'crypto'