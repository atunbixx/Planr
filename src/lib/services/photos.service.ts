import { prisma } from '@/lib/prisma'

export interface PhotoUploadData {
  coupleId: string
  filename: string
  originalFilename: string
  fileSize: number
  mimeType: string
  storagePath: string
  url: string
  caption?: string
  tags?: string[]
  uploadedBy: string
}

export interface PhotoWithDetails {
  id: string
  filename: string
  originalFilename: string
  url: string
  caption?: string
  tags: string[]
  isFavorite: boolean
  fileSize: number
  mimeType: string
  uploadedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface PhotoGallery {
  photos: PhotoWithDetails[]
  totalCount: number
  favoriteCount: number
  totalSize: number
  categories: { tag: string; count: number }[]
}

export class PhotosService {
  // Upload a photo
  static async uploadPhoto(data: PhotoUploadData) {
    return await prisma.photos.create({
      data: {
        couple_id: data.coupleId,
        filename: data.filename,
        original_filename: data.originalFilename,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        storage_path: data.storagePath,
        url: data.url,
        caption: data.caption,
        tags: data.tags || [],
        uploaded_by: data.uploadedBy
      }
    })
  }

  // Get photos for a couple with pagination and filtering
  static async getPhotos(coupleId: string, options: {
    page?: number
    limit?: number
    tags?: string[]
    favorites?: boolean
    search?: string
  } = {}): Promise<PhotoGallery> {
    const { page = 1, limit = 20, tags, favorites, search } = options
    const skip = (page - 1) * limit

    const where: any = { couple_id: coupleId }

    if (tags && tags.length > 0) {
      where.tags = {
        hasEvery: tags
      }
    }

    if (favorites) {
      where.is_favorite = true
    }

    if (search) {
      where.OR = [
        { caption: { contains: search, mode: 'insensitive' } },
        { original_filename: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ]
    }

    const [photos, totalCount, favoriteCount, stats] = await Promise.all([
      prisma.photos.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.photos.count({ where }),
      prisma.photos.count({ where: { couple_id: coupleId, is_favorite: true } }),
      prisma.photos.aggregate({
        where: { couple_id: coupleId },
        _sum: { file_size: true }
      })
    ])

    // Get tag categories
    const allPhotos = await prisma.photos.findMany({
      where: { couple_id: coupleId },
      select: { tags: true }
    })

    const tagCounts: { [key: string]: number } = {}
    allPhotos.forEach(photo => {
      photo.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    const categories = Object.entries(tagCounts).map(([tag, count]) => ({
      tag,
      count
    }))

    return {
      photos: photos.map(photo => ({
        id: photo.id,
        filename: photo.filename,
        originalFilename: photo.original_filename || '',
        url: photo.url || '',
        caption: photo.caption || undefined,
        tags: photo.tags,
        isFavorite: photo.is_favorite,
        fileSize: photo.file_size || 0,
        mimeType: photo.mime_type || '',
        uploadedBy: photo.uploaded_by || '',
        createdAt: photo.created_at,
        updatedAt: photo.updated_at
      })),
      totalCount,
      favoriteCount,
      totalSize: stats._sum.file_size || 0,
      categories
    }
  }

  // Toggle favorite status
  static async toggleFavorite(photoId: string, isFavorite: boolean) {
    return await prisma.photos.update({
      where: { id: photoId },
      data: { is_favorite: isFavorite }
    })
  }

  // Update photo details
  static async updatePhoto(photoId: string, data: {
    caption?: string
    tags?: string[]
  }) {
    return await prisma.photos.update({
      where: { id: photoId },
      data: {
        caption: data.caption,
        tags: data.tags,
        updated_at: new Date()
      }
    })
  }

  // Delete photo
  static async deletePhoto(photoId: string) {
    return await prisma.photos.delete({
      where: { id: photoId }
    })
  }

  // Batch upload photos
  static async batchUpload(photos: PhotoUploadData[]) {
    return await prisma.photos.createMany({
      data: photos.map(photo => ({
        couple_id: photo.coupleId,
        filename: photo.filename,
        original_filename: photo.originalFilename,
        file_size: photo.fileSize,
        mime_type: photo.mimeType,
        storage_path: photo.storagePath,
        url: photo.url,
        caption: photo.caption,
        tags: photo.tags || [],
        uploaded_by: photo.uploadedBy
      }))
    })
  }

  // Get photo by ID
  static async getPhotoById(photoId: string) {
    const photo = await prisma.photos.findUnique({
      where: { id: photoId }
    })

    if (!photo) return null

    return {
      id: photo.id,
      filename: photo.filename,
      originalFilename: photo.original_filename || '',
      url: photo.url || '',
      caption: photo.caption || undefined,
      tags: photo.tags,
      isFavorite: photo.is_favorite,
      fileSize: photo.file_size || 0,
      mimeType: photo.mime_type || '',
      uploadedBy: photo.uploaded_by || '',
      createdAt: photo.created_at,
      updatedAt: photo.updated_at
    }
  }

  // Get storage statistics
  static async getStorageStats(coupleId: string) {
    const stats = await prisma.photos.aggregate({
      where: { couple_id: coupleId },
      _count: { id: true },
      _sum: { file_size: true },
      _avg: { file_size: true }
    })

    const favoriteCount = await prisma.photos.count({
      where: { couple_id: coupleId, is_favorite: true }
    })

    return {
      totalPhotos: stats._count.id || 0,
      totalSize: stats._sum.file_size || 0,
      averageSize: stats._avg.file_size || 0,
      favoriteCount
    }
  }

  // Search photos by tags or caption
  static async searchPhotos(coupleId: string, query: string) {
    return await prisma.photos.findMany({
      where: {
        couple_id: coupleId,
        OR: [
          { caption: { contains: query, mode: 'insensitive' } },
          { original_filename: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ]
      },
      orderBy: { created_at: 'desc' }
    })
  }

  // Get recent photos
  static async getRecentPhotos(coupleId: string, limit: number = 10) {
    return await prisma.photos.findMany({
      where: { couple_id: coupleId },
      orderBy: { created_at: 'desc' },
      take: limit
    })
  }
}