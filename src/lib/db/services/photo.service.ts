import { BaseService } from './base.service'
import { Photo, Prisma } from '@prisma/client'
import { PhotoWithAlbum, PhotoStats } from '@/types/api'
import { BadRequestException } from '@/lib/api/errors'

export class PhotoService extends BaseService<Photo> {
  protected modelName = 'photo' as const

  // Get photos for a couple with statistics
  async getPhotosByCouple(coupleId: string): Promise<{
    photos: PhotoWithAlbum[]
    stats: PhotoStats
  }> {
    const photos = await this.prisma.photo.findMany({
      where: { coupleId },
      include: {
        album: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' as const }
    })

    // Calculate statistics
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const stats: PhotoStats = {
      total: photos.length,
      withAlbums: photos.filter(p => p.albumId).length,
      recent: photos.filter(p => new Date(p.createdAt) > weekAgo).length
    }

    return { photos, stats }
  }

  // Get photos by album
  async getPhotosByAlbum(
    coupleId: string, 
    albumId: string
  ): Promise<PhotoWithAlbum[]> {
    return await this.findMany({
      where: { coupleId, albumId },
      include: {
        album: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' as const }
    })
  }

  // Create single photo
  async createPhoto(
    coupleId: string, 
    data: {
      url: string
      publicId: string
      albumId?: string
      caption?: string
      tags?: string[]
    }
  ): Promise<Photo> {
    if (!data.url || !data.publicId) {
      throw new BadRequestException('URL and publicId are required')
    }

    return await this.create({
      ...data,
      coupleId
    })
  }

  // Bulk create photos
  async createManyPhotos(
    coupleId: string,
    photos: Array<{
      url: string
      publicId: string
      albumId?: string
      caption?: string
      tags?: string[]
    }>
  ): Promise<{ count: number }> {
    const data = photos.map(photo => ({
      ...photo,
      coupleId
    }))

    return await this.createMany(data)
  }

  // Update photo
  async updatePhoto(
    id: string,
    coupleId: string,
    data: Partial<{
      albumId: string | null
      caption: string
      tags: string[]
    }>
  ): Promise<Photo> {
    // Verify ownership
    const photo = await this.findFirst({ id, coupleId })
    if (!photo) {
      throw new BadRequestException('Photo not found')
    }

    return await this.update(id, data)
  }

  // Move photos to album
  async movePhotosToAlbum(
    coupleId: string,
    photoIds: string[],
    albumId: string | null
  ): Promise<{ count: number }> {
    return await this.updateMany(
      {
        id: { in: photoIds },
        coupleId
      },
      { albumId }
    )
  }

  // Delete photo
  async deletePhoto(id: string, coupleId: string): Promise<Photo> {
    // Verify ownership
    const photo = await this.findFirst({ id, coupleId })
    if (!photo) {
      throw new BadRequestException('Photo not found')
    }

    return await this.delete(id)
  }

  // Delete multiple photos
  async deletePhotos(
    coupleId: string,
    photoIds: string[]
  ): Promise<{ count: number }> {
    return await this.deleteMany({
      id: { in: photoIds },
      coupleId
    })
  }

  // Search photos by tags or caption
  async searchPhotos(
    coupleId: string,
    searchTerm: string
  ): Promise<PhotoWithAlbum[]> {
    return await this.findMany({
      where: {
        coupleId,
        OR: [
          { caption: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { has: searchTerm } }
        ]
      },
      include: {
        album: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' as const }
    })
  }
}