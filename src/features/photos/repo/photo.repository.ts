import { prisma } from '@/lib/db/prisma'
import { type CreatePhotoInput, type UpdatePhotoInput, type PhotoFilterInput, type CreateAlbumInput, type UpdateAlbumInput } from '../dto/photo.dto'

export class PhotoRepository {
  async listPhotos(userId: string, filters?: PhotoFilterInput) {
    const { albumId, q, limit = 50, offset = 0 } = filters || {}
    const where: any = { userId }
    if (albumId) where.albumId = albumId
    if (q) where.OR = [
      { caption: { contains: q, mode: 'insensitive' } },
      { alt: { contains: q, mode: 'insensitive' } },
    ]
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({ where, orderBy: [{ albumId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }], take: limit, skip: offset }),
      prisma.photo.count({ where }),
    ])
    return { photos, total, limit, offset }
  }

  async getPhoto(userId: string, id: string) {
    return prisma.photo.findFirst({ where: { id, userId } })
  }

  async createPhoto(userId: string, data: CreatePhotoInput) {
    // If isPrimary is set true for an album, unset others
    if (data.albumId && data.isPrimary) {
      await prisma.photo.updateMany({ where: { userId, albumId: data.albumId }, data: { isPrimary: false } })
    }
    const order = typeof data.order === 'number' ? data.order : 0
    return prisma.photo.create({ data: { ...data, order, userId } })
  }

  async updatePhoto(userId: string, id: string, data: UpdatePhotoInput) {
    // Handle isPrimary toggle per album
    if (data.isPrimary && (data.albumId || true)) {
      const current = await prisma.photo.findFirst({ where: { id, userId } })
      const targetAlbumId = data.albumId === undefined ? current?.albumId : data.albumId || null
      if (targetAlbumId) {
        await prisma.photo.updateMany({ where: { userId, albumId: targetAlbumId }, data: { isPrimary: false } })
      }
    }
    return prisma.photo.update({ where: { id }, data: data as any })
  }

  async deletePhoto(userId: string, id: string) {
    // Ensure photo belongs to user
    const p = await prisma.photo.findFirst({ where: { id, userId } })
    if (!p) return false
    await prisma.photo.delete({ where: { id } })
    return true
  }

  async reorder(userId: string, albumId: string | null, orderedIds: string[]) {
    // Reorder photos within an album (or unassigned group when albumId is null)
    const updates = orderedIds.map((id, idx) =>
      prisma.photo.updateMany({ where: { id, userId, albumId: albumId ?? null }, data: { order: idx } })
    )
    await prisma.$transaction(updates)
    return true
  }
}

export class AlbumRepository {
  async listAlbums(userId: string, limit = 50, offset = 0) {
    const [albums, total] = await Promise.all([
      prisma.photoAlbum.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
      prisma.photoAlbum.count({ where: { userId } }),
    ])
    return { albums, total, limit, offset }
  }

  async getAlbum(userId: string, id: string) {
    return prisma.photoAlbum.findFirst({ where: { id, userId } })
  }

  async createAlbum(userId: string, data: CreateAlbumInput) {
    return prisma.photoAlbum.create({ data: { ...data, userId } })
  }

  async updateAlbum(userId: string, id: string, data: UpdateAlbumInput) {
    // Validate cover photo belongs to user if set
    if (data.coverPhotoId) {
      const p = await prisma.photo.findFirst({ where: { id: data.coverPhotoId, userId } })
      if (!p) throw new Error('Cover photo not found for user')
    }
    return prisma.photoAlbum.update({ where: { id }, data: data as any })
  }

  async deleteAlbum(userId: string, id: string) {
    const a = await prisma.photoAlbum.findFirst({ where: { id, userId } })
    if (!a) return false
    await prisma.$transaction([
      prisma.photo.updateMany({ where: { albumId: id, userId }, data: { albumId: null, isPrimary: false } }),
      prisma.photoAlbum.delete({ where: { id } })
    ])
    return true
  }
}

