import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/features/couples'

// Validation schemas - Updated to match Prisma schema
const createPhotoSchema = z.object({
  albumId: z.string().optional(),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isFavorite: z.boolean().optional().default(false),
  isPrivate: z.boolean().optional().default(false),
  originalFilename: z.string().optional(),
  fileSize: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  mimeType: z.string().optional()
})

const updatePhotoSchema = z.object({
  albumId: z.string().nullable().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
  isPrivate: z.boolean().optional()
})

const bulkPhotoActionSchema = z.object({
  photoIds: z.array(z.string()).min(1),
  action: z.enum(['delete', 'move', 'favorite', 'unfavorite', 'private', 'unprivate']),
  albumId: z.string().optional() // For move action
})

const createAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  coverPhotoId: z.string().optional(),
  isPrivate: z.boolean().optional().default(false)
})

const updateAlbumSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  coverPhotoId: z.string().nullable().optional(),
  isPrivate: z.boolean().optional()
})

export class PhotosHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    try {
      switch (request.method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    
    const albumId = searchParams.get('albumId')
    const isFavorite = searchParams.get('isFavorite') === 'true'
    const isPrivate = searchParams.get('isPrivate') === 'true'
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Build where clause
    const where: any = {
      coupleId: couple.id
    }

    if (albumId) {
      where.albumId = albumId
    }

    if (isFavorite) {
      where.isFavorite = true
    }

    if (isPrivate) {
      where.isPrivate = true
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags
      }
    }

    // Get photos
    const [photos, totalCount] = await Promise.all([
      prisma.photo.findMany({
        where,
        include: {
          photoAlbums: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.photo.count({ where })
    ])

    // Get photo statistics
    const [favoriteCount, publicCount] = await Promise.all([
      prisma.photo.count({
        where: { coupleId: couple.id, isFavorite: true }
      }),
      prisma.photo.count({
        where: { coupleId: couple.id, isPrivate: false }
      })
    ])

    return this.successResponse({
      photos: photos.map(photo => ({
        id: photo.id,
        albumId: photo.albumId,
        albumName: photo.photoAlbums?.name,
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl,
        title: photo.title,
        description: photo.description,
        tags: photo.tags || [],
        isFavorite: photo.isFavorite,
        isPrivate: photo.is_shared,
        originalFilename: photo.originalFilename,
        fileSize: photo.fileSize,
        width: photo.width,
        height: photo.height,
        mimeType: photo.mimeType,
        uploadedAt: photo.createdAt,
        updatedAt: photo.updatedAt
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      statistics: {
        total: totalCount,
        favorites: favoriteCount,
        public: publicCount
      }
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = createPhotoSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // If albumId is provided, verify it belongs to the couple
    if (validatedData.albumId) {
      const album = await prisma.photoAlbum.findFirst({
        where: {
          id: validatedData.albumId,
          coupleId: couple.id
        }
      })

      if (!album) {
        return this.errorResponse('ALBUM_NOT_FOUND', 'Album not found', 404)
      }
    }

    // Create photo
    const photo = await prisma.photo.create({
      data: {
        coupleId: couple.id,
        albumId: validatedData.albumId,
        imageUrl: validatedData.imageUrl,
        thumbnailUrl: validatedData.thumbnailUrl,
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        isFavorite: validatedData.isFavorite,
        isPrivate: validatedData.isPrivate,
        originalFilename: validatedData.originalFilename,
        fileSize: validatedData.fileSize,
        width: validatedData.width,
        height: validatedData.height,
        mimeType: validatedData.mimeType
      },
      include: {
        photoAlbums: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return this.successResponse({
      photo: {
        id: photo.id,
        albumId: photo.albumId,
        albumName: photo.photoAlbums?.name,
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl,
        title: photo.title,
        description: photo.description,
        tags: photo.tags || [],
        isFavorite: photo.isFavorite,
        isPrivate: photo.is_shared,
        originalFilename: photo.originalFilename,
        fileSize: photo.fileSize,
        width: photo.width,
        height: photo.height,
        mimeType: photo.mimeType,
        uploadedAt: photo.createdAt
      }
    }, 201)
  }
}

export class PhotoDetailHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    try {
      switch (request.method) {
        case 'GET':
          return await this.handleGet(request, context)
        case 'PUT':
          return await this.handlePut(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const photoId = resolvedParams.id

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get photo
    const photo = await prisma.photo.findUnique({
      where: {
        id: photoId,
        coupleId: couple.id
      },
      include: {
        photoAlbums: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    if (!photo) {
      return this.errorResponse('PHOTO_NOT_FOUND', 'Photo not found', 404)
    }

    return this.successResponse({
      photo: {
        id: photo.id,
        albumId: photo.albumId,
        albumName: photo.photoAlbums?.name,
        albumDescription: photo.photoAlbums?.description,
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl,
        title: photo.title,
        description: photo.description,
        tags: photo.tags || [],
        isFavorite: photo.isFavorite,
        isPrivate: photo.is_shared,
        originalFilename: photo.originalFilename,
        fileSize: photo.fileSize,
        width: photo.width,
        height: photo.height,
        mimeType: photo.mimeType,
        uploadedAt: photo.createdAt,
        updatedAt: photo.updatedAt
      }
    })
  }

  private async handlePut(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const photoId = resolvedParams.id
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = updatePhotoSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get existing photo to verify ownership
    const existingPhoto = await prisma.photo.findUnique({
      where: {
        id: photoId,
        coupleId: couple.id
      }
    })

    if (!existingPhoto) {
      return this.errorResponse('PHOTO_NOT_FOUND', 'Photo not found', 404)
    }

    // If changing album, verify new album belongs to couple
    if (validatedData.albumId !== undefined) {
      if (validatedData.albumId) {
        const album = await prisma.photoAlbum.findFirst({
          where: {
            id: validatedData.albumId,
            coupleId: couple.id
          }
        })

        if (!album) {
          return this.errorResponse('ALBUM_NOT_FOUND', 'Album not found', 404)
        }
      }
    }

    // Update photo
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        albumId: validatedData.albumId,
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        isFavorite: validatedData.isFavorite,
        is_shared: validatedData.isPrivate,
        updatedAt: new Date()
      },
      include: {
        photoAlbums: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return this.successResponse({
      photo: {
        id: updatedPhoto.id,
        albumId: updatedPhoto.albumId,
        albumName: updatedPhoto.album?.name,
        url: updatedPhoto.url,
        thumbnailUrl: updatedPhoto.thumbnailUrl,
        title: updatedPhoto.title,
        description: updatedPhoto.description,
        tags: updatedPhoto.tags || [],
        isFavorite: updatedPhoto.isFavorite,
        isPrivate: updatedPhoto.is_shared,
        originalFilename: updatedPhoto.originalFilename,
        fileSize: updatedPhoto.fileSize,
        width: updatedPhoto.width,
        height: updatedPhoto.height,
        mimeType: updatedPhoto.mimeType,
        uploadedAt: updatedPhoto.createdAt,
        updatedAt: updatedPhoto.updatedAt
      }
    })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const photoId = resolvedParams.id

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get photo to verify ownership
    const photo = await prisma.photo.findUnique({
      where: {
        id: photoId,
        coupleId: couple.id
      }
    })

    if (!photo) {
      return this.errorResponse('PHOTO_NOT_FOUND', 'Photo not found', 404)
    }

    // Delete photo
    await prisma.photo.delete({
      where: { id: photoId }
    })

    // TODO: Delete from cloud storage if applicable

    return this.successResponse({
      message: 'Photo deleted successfully'
    })
  }
}

export class PhotoBulkHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handlePost(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = bulkPhotoActionSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify all photos belong to the couple
    const photoCount = await prisma.photo.count({
      where: {
        id: { in: validatedData.photoIds },
        coupleId: couple.id
      }
    })

    if (photoCount !== validatedData.photoIds.length) {
      return this.errorResponse('INVALID_PHOTOS', 'Some photos not found or not owned by couple', 400)
    }

    let result: any = {}

    switch (validatedData.action) {
      case 'delete':
        await prisma.photo.deleteMany({
          where: {
            id: { in: validatedData.photoIds },
            coupleId: couple.id
          }
        })
        result = { deleted: validatedData.photoIds.length }
        break

      case 'move':
        if (!validatedData.albumId) {
          return this.errorResponse('ALBUM_REQUIRED', 'Album ID required for move action', 400)
        }

        // Verify album belongs to couple
        const album = await prisma.photoAlbum.findFirst({
          where: {
            id: validatedData.albumId,
            coupleId: couple.id
          }
        })

        if (!album) {
          return this.errorResponse('ALBUM_NOT_FOUND', 'Album not found', 404)
        }

        await prisma.photo.updateMany({
          where: {
            id: { in: validatedData.photoIds },
            coupleId: couple.id
          },
          data: {
            albumId: validatedData.albumId,
            updatedAt: new Date()
          }
        })
        result = { moved: validatedData.photoIds.length, albumId: validatedData.albumId }
        break

      case 'favorite':
        await prisma.photo.updateMany({
          where: {
            id: { in: validatedData.photoIds },
            coupleId: couple.id
          },
          data: {
            isFavorite: true,
            updatedAt: new Date()
          }
        })
        result = { favorited: validatedData.photoIds.length }
        break

      case 'unfavorite':
        await prisma.photo.updateMany({
          where: {
            id: { in: validatedData.photoIds },
            coupleId: couple.id
          },
          data: {
            isFavorite: false,
            updatedAt: new Date()
          }
        })
        result = { unfavorited: validatedData.photoIds.length }
        break

      case 'private':
        await prisma.photo.updateMany({
          where: {
            id: { in: validatedData.photoIds },
            coupleId: couple.id
          },
          data: {
            isPrivate: true,
            updatedAt: new Date()
          }
        })
        result = { madePrivate: validatedData.photoIds.length }
        break

      case 'unprivate':
        await prisma.photo.updateMany({
          where: {
            id: { in: validatedData.photoIds },
            coupleId: couple.id
          },
          data: {
            isPrivate: false,
            updatedAt: new Date()
          }
        })
        result = { madePublic: validatedData.photoIds.length }
        break
    }

    return this.successResponse({
      action: validatedData.action,
      photoIds: validatedData.photoIds,
      result
    })
  }
}

export class AlbumsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    try {
      switch (request.method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    
    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get albums with photo counts
    const albums = await prisma.photoAlbum.findMany({
      where: { coupleId: couple.id },
      include: {
        _count: {
          select: { photos: true }
        },
        coverPhoto: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return this.successResponse({
      albums: albums.map(album => ({
        id: album.id,
        name: album.name,
        description: album.description,
        coverPhotoId: album.coverPhotoId,
        coverPhotoUrl: album.coverPhoto?.thumbnailUrl || album.coverPhoto?.url,
        isPrivate: album.isPrivate,
        photoCount: album._count.photos,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt
      }))
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = createAlbumSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // If cover photo is provided, verify it belongs to the couple
    if (validatedData.coverPhotoId) {
      const photo = await prisma.photo.findFirst({
        where: {
          id: validatedData.coverPhotoId,
          coupleId: couple.id
        }
      })

      if (!photo) {
        return this.errorResponse('PHOTO_NOT_FOUND', 'Cover photo not found', 404)
      }
    }

    // Create album
    const album = await prisma.photoAlbum.create({
      data: {
        coupleId: couple.id,
        name: validatedData.name,
        description: validatedData.description,
        coverPhotoId: validatedData.coverPhotoId,
        isPrivate: validatedData.isPrivate
      },
      include: {
        coverPhoto: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true
          }
        }
      }
    })

    return this.successResponse({
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        coverPhotoId: album.coverPhotoId,
        coverPhotoUrl: album.coverPhoto?.thumbnailUrl || album.coverPhoto?.url,
        isPrivate: album.isPrivate,
        photoCount: 0,
        createdAt: album.createdAt
      }
    }, 201)
  }
}

export class AlbumDetailHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    try {
      switch (request.method) {
        case 'GET':
          return await this.handleGet(request, context)
        case 'PUT':
          return await this.handlePut(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const albumId = resolvedParams.id

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get album with photos
    const album = await prisma.photoAlbum.findUnique({
      where: {
        id: albumId,
        coupleId: couple.id
      },
      include: {
        _count: {
          select: { photos: true }
        },
        coverPhoto: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true
          }
        },
        photos: {
          orderBy: { createdAt: 'desc' },
          take: 50 // Limit for initial load
        }
      }
    })

    if (!album) {
      return this.errorResponse('ALBUM_NOT_FOUND', 'Album not found', 404)
    }

    return this.successResponse({
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        coverPhotoId: album.coverPhotoId,
        coverPhotoUrl: album.coverPhoto?.thumbnailUrl || album.coverPhoto?.url,
        isPrivate: album.isPrivate,
        photoCount: album._count.photos,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        photos: album.photos.map(photo => ({
          id: photo.id,
          imageUrl: photo.imageUrl,
          thumbnailUrl: photo.thumbnailUrl,
          title: photo.title,
          description: photo.description,
          tags: photo.tags || [],
          isFavorite: photo.isFavorite,
          isPrivate: photo.is_shared,
          uploadedAt: photo.createdAt
        }))
      }
    })
  }

  private async handlePut(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const albumId = resolvedParams.id
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = updateAlbumSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get existing album to verify ownership
    const existingAlbum = await prisma.photoAlbum.findUnique({
      where: {
        id: albumId,
        coupleId: couple.id
      }
    })

    if (!existingAlbum) {
      return this.errorResponse('ALBUM_NOT_FOUND', 'Album not found', 404)
    }

    // If changing cover photo, verify it belongs to the couple
    if (validatedData.coverPhotoId !== undefined && validatedData.coverPhotoId) {
      const photo = await prisma.photo.findFirst({
        where: {
          id: validatedData.coverPhotoId,
          coupleId: couple.id
        }
      })

      if (!photo) {
        return this.errorResponse('PHOTO_NOT_FOUND', 'Cover photo not found', 404)
      }
    }

    // Update album
    const updatedAlbum = await prisma.photoAlbum.update({
      where: { id: albumId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        coverPhotoId: validatedData.coverPhotoId,
        isPrivate: validatedData.isPrivate,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: { photos: true }
        },
        coverPhoto: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true
          }
        }
      }
    })

    return this.successResponse({
      album: {
        id: updatedAlbum.id,
        name: updatedAlbum.name,
        description: updatedAlbum.description,
        coverPhotoId: updatedAlbum.coverPhotoId,
        coverPhotoUrl: updatedAlbum.coverPhoto?.thumbnailUrl || updatedAlbum.coverPhoto?.url,
        isPrivate: updatedAlbum.isPrivate,
        photoCount: updatedAlbum._count.photos,
        createdAt: updatedAlbum.createdAt,
        updatedAt: updatedAlbum.updatedAt
      }
    })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const albumId = resolvedParams.id

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get album to verify ownership
    const album = await prisma.photoAlbum.findUnique({
      where: {
        id: albumId,
        coupleId: couple.id
      },
      include: {
        _count: {
          select: { photos: true }
        }
      }
    })

    if (!album) {
      return this.errorResponse('ALBUM_NOT_FOUND', 'Album not found', 404)
    }

    // Don't delete if album has photos
    if (album._count.photos > 0) {
      return this.errorResponse('ALBUM_NOT_EMPTY', 'Cannot delete album with photos', 400)
    }

    // Delete album
    await prisma.photoAlbum.delete({
      where: { id: albumId }
    })

    return this.successResponse({
      message: 'Album deleted successfully'
    })
  }
}