import { prisma } from '@/lib/prisma'
import { Photo, Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class PhotoRepository extends BaseRepository<Photo> {
  constructor() {
    super('Photo')
  }

  async findById(id: string): Promise<Photo | null> {
    return this.executeQuery(() =>
      prisma.photo.findUnique({ 
        where: { id },
        include: {
          photoAlbum: true
        }
      })
    )
  }

  async findByCoupleId(coupleId: string, filters?: {
    albumId?: string
    eventType?: string
    isFavorite?: boolean
    isPrivate?: boolean
    limit?: number
    offset?: number
  }): Promise<Photo[]> {
    return this.executeQuery(() => {
      const where: Prisma.PhotoWhereInput = { couple_id: coupleId }
      
      if (filters?.albumId) where.album_id = filters.albumId
      if (filters?.eventType) where.event_type = filters.eventType
      if (filters?.isFavorite !== undefined) where.is_favorite = filters.isFavorite
      if (filters?.isPrivate !== undefined) where.is_private = filters.isPrivate

      return prisma.photo.findMany({ 
        where,
        include: {
          photo_albums: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset
      })
    })
  }

  async create(data: Prisma.PhotoCreateInput): Promise<Photo> {
    return this.executeQuery(() =>
      prisma.photo.create({ 
        data,
        include: {
          photoAlbum: true
        }
      })
    )
  }

  async createMany(data: Prisma.PhotoCreateManyInput[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.photo.createMany({ data })
    )
  }

  async update(id: string, data: Prisma.PhotoUpdateInput): Promise<Photo> {
    return this.executeQuery(() =>
      prisma.photo.update({ 
        where: { id },
        data,
        include: {
          photoAlbum: true
        }
      })
    )
  }

  async updateMany(ids: string[], data: Prisma.PhotoUpdateInput): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.photo.updateMany({
        where: { id: { in: ids } },
        data
      })
    )
  }

  async toggleFavorite(id: string): Promise<Photo> {
    return this.executeQuery(async () => {
      const photo = await prisma.photo.findUnique({ where: { id } })
      if (!photo) throw new Error('Photo not found')

      return prisma.photo.update({
        where: { id },
        data: { is_favorite: !photo.is_favorite },
        include: {
          photoAlbum: true
        }
      })
    })
  }

  async moveToAlbum(photoIds: string[], albumId: string | null): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.photo.updateMany({
        where: { id: { in: photoIds } },
        data: { album_id: albumId }
      })
    )
  }

  async delete(id: string): Promise<Photo> {
    return this.executeQuery(() =>
      prisma.photo.delete({ 
        where: { id },
        include: {
          photoAlbum: true
        }
      })
    )
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.photo.deleteMany({ 
        where: { 
          id: { in: ids } 
        } 
      })
    )
  }

  async getStatsByCoupleId(coupleId: string): Promise<{
    totalPhotos: number
    totalAlbums: number
    favoritePhotos: number
    privatePhotos: number
    photosByEventType: Array<{
      eventType: string
      count: number
    }>
    storageUsed: number
  }> {
    return this.executeQuery(async () => {
      const [totalPhotos, favoritePhotos, privatePhotos, photosByEvent, storageStats, totalAlbums] = await Promise.all([
        prisma.photo.count({ where: { couple_id: coupleId } }),
        prisma.photo.count({ where: { couple_id: coupleId, is_favorite: true } }),
        prisma.photo.count({ where: { couple_id: coupleId, is_private: true } }),
        prisma.photo.groupBy({
          by: ['event_type'],
          where: { couple_id: coupleId },
          _count: true
        }),
        prisma.photo.aggregate({
          where: { couple_id: coupleId },
          _sum: { file_size: true }
        }),
        prisma.photoAlbum.count({ where: { couple_id: coupleId } })
      ])

      return {
        totalPhotos,
        totalAlbums,
        favoritePhotos,
        privatePhotos,
        photosByEventType: photosByEvent.map(e => ({
          eventType: e.event_type || 'general',
          count: e._count
        })),
        storageUsed: storageStats._sum.file_size || 0
      }
    })
  }

  async getByEventType(coupleId: string, eventType: string): Promise<Photo[]> {
    return this.executeQuery(() =>
      prisma.photo.findMany({
        where: {
          couple_id: coupleId,
          event_type: eventType
        },
        include: {
          photoAlbum: true
        },
        orderBy: { photo_date: 'desc' }
      })
    )
  }

  async searchByTags(coupleId: string, tags: string[]): Promise<Photo[]> {
    return this.executeQuery(() =>
      prisma.photo.findMany({
        where: {
          couple_id: coupleId,
          tags: {
            hasSome: tags
          }
        },
        include: {
          photoAlbum: true
        },
        orderBy: { created_at: 'desc' }
      })
    )
  }
}