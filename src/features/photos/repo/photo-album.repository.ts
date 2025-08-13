import { prisma } from '@/lib/prisma'
import { PhotoAlbum, Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class PhotoAlbumRepository extends BaseRepository<PhotoAlbum> {
  async findById(id: string): Promise<PhotoAlbum | null> {
    return this.executeQuery(() =>
      prisma.photoAlbum.findUnique({ 
        where: { id },
        include: {
          _count: {
            select: { photos: true }
          }
        }
      })
    )
  }

  async findByCoupleId(coupleId: string): Promise<PhotoAlbum[]> {
    return this.executeQuery(() =>
      prisma.photoAlbum.findMany({ 
        where: { couple_id: coupleId },
        include: {
          _count: {
            select: { photos: true }
          },
          photos: {
            select: {
              id: true,
              url: true,
              thumbnail_url: true
            },
            take: 4,
            orderBy: { created_at: 'desc' }
          }
        },
        orderBy: { created_at: 'desc' }
      })
    )
  }

  async findByName(name: string, coupleId: string): Promise<PhotoAlbum | null> {
    return this.executeQuery(() =>
      prisma.photoAlbum.findFirst({ 
        where: { 
          name,
          couple_id: coupleId 
        } 
      })
    )
  }

  async create(data: Prisma.PhotoAlbumCreateInput): Promise<PhotoAlbum> {
    return this.executeQuery(() =>
      prisma.photoAlbum.create({ 
        data,
        include: {
          _count: {
            select: { photos: true }
          }
        }
      })
    )
  }

  async createDefaults(coupleId: string): Promise<PhotoAlbum[]> {
    const defaultAlbums = [
      { name: 'Engagement', description: 'Our engagement photos and memories', event_type: 'engagement', icon: '💍' },
      { name: 'Pre-Wedding', description: 'Getting ready and preparation photos', event_type: 'pre_wedding', icon: '🎭' },
      { name: 'Ceremony', description: 'Our wedding ceremony moments', event_type: 'ceremony', icon: '💒' },
      { name: 'Reception', description: 'Reception party and celebrations', event_type: 'reception', icon: '🎉' },
      { name: 'Honeymoon', description: 'Our honeymoon adventures', event_type: 'honeymoon', icon: '🏖️' }
    ]

    return this.withTransaction(async (tx) => {
      const albums = await Promise.all(
        defaultAlbums.map(album =>
          tx.photoAlbum.create({
            data: {
              couple_id: coupleId,
              ...album
            }
          })
        )
      )
      return albums
    })
  }

  async update(id: string, data: Prisma.PhotoAlbumUpdateInput): Promise<PhotoAlbum> {
    return this.executeQuery(() =>
      prisma.photoAlbum.update({ 
        where: { id },
        data,
        include: {
          _count: {
            select: { photos: true }
          }
        }
      })
    )
  }

  async updatePrivacy(id: string, isPrivate: boolean): Promise<PhotoAlbum> {
    return this.executeQuery(() =>
      prisma.photoAlbum.update({
        where: { id },
        data: { is_private: isPrivate },
        include: {
          _count: {
            select: { photos: true }
          }
        }
      })
    )
  }

  async updateSharing(id: string, isShared: boolean, shareUrl?: string): Promise<PhotoAlbum> {
    return this.executeQuery(() =>
      prisma.photoAlbum.update({
        where: { id },
        data: { 
          is_shared: isShared,
          share_url: isShared ? (shareUrl || `album-${id}-${Date.now()}`) : null
        },
        include: {
          _count: {
            select: { photos: true }
          }
        }
      })
    )
  }

  async delete(id: string): Promise<PhotoAlbum> {
    return this.executeQuery(() =>
      prisma.photoAlbum.delete({ 
        where: { id },
        include: {
          _count: {
            select: { photos: true }
          }
        }
      })
    )
  }

  async getAlbumWithPhotos(id: string): Promise<PhotoAlbum & { photos: any[] }> {
    return this.executeQuery(() =>
      prisma.photoAlbum.findUniqueOrThrow({
        where: { id },
        include: {
          photos: {
            orderBy: { created_at: 'desc' }
          },
          _count: {
            select: { photos: true }
          }
        }
      })
    )
  }

  async getSharedAlbum(shareUrl: string): Promise<PhotoAlbum | null> {
    return this.executeQuery(() =>
      prisma.photoAlbum.findFirst({
        where: { 
          share_url: shareUrl,
          is_shared: true
        },
        include: {
          photos: {
            where: { is_private: false },
            orderBy: { created_at: 'desc' }
          },
          _count: {
            select: { photos: true }
          }
        }
      })
    )
  }

  async getAlbumStats(coupleId: string): Promise<Array<{
    id: string
    name: string
    photoCount: number
    lastUpdated: Date | null
    totalSize: number
  }>> {
    return this.executeQuery(async () => {
      const albums = await prisma.photoAlbum.findMany({
        where: { couple_id: coupleId },
        include: {
          photos: {
            select: {
              file_size: true,
              created_at: true
            }
          }
        }
      })

      return albums.map(album => ({
        id: album.id,
        name: album.name,
        photoCount: album.photos.length,
        lastUpdated: album.photos.length > 0 
          ? album.photos.reduce((latest, photo) => 
              photo.created_at > latest ? photo.created_at : latest, 
              album.photos[0].created_at
            )
          : null,
        totalSize: album.photos.reduce((sum, photo) => sum + (photo.file_size || 0), 0)
      }))
    })
  }
}