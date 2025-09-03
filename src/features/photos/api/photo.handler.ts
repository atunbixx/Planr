import { NextRequest, NextResponse } from 'next/server'
import { startSpan } from '@/lib/observability/otel'
import { CreatePhotoDto, UpdatePhotoDto, PhotoFilterDto, PhotoListResponseDto, PhotoResponseDto, CreateAlbumDto, UpdateAlbumDto, AlbumListResponseDto, AlbumResponseDto } from '@/contracts/photos'
import { PhotoRepository, AlbumRepository } from '../repo/photo.repository'

export class PhotoHandler {
  private repo = new PhotoRepository()

  async list(request: NextRequest, userId: string): Promise<NextResponse> {
    const span = await startSpan('photos.list', { userId })
    try {
      const url = new URL(request.url)
      const filters = PhotoFilterDto.parse({
        albumId: url.searchParams.get('albumId') || undefined,
        q: url.searchParams.get('q') || undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
      })
      const { photos, total, limit, offset } = await this.repo.listPhotos(userId, filters)
      const data = PhotoListResponseDto.parse({ photos, total, limit, offset })
      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('photos.list error', error)
      return NextResponse.json({ success: false, error: { message: 'Failed to list photos' } }, { status: 500 })
    } finally { span.end() }
  }

  async get(id: string, userId: string): Promise<NextResponse> {
    try {
      const p = await this.repo.getPhoto(userId, id)
      if (!p) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
      const data = PhotoResponseDto.parse(p)
      return NextResponse.json({ success: true, data })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to get photo' } }, { status: 500 })
    }
  }

  async create(request: NextRequest, userId: string): Promise<NextResponse> {
    const span = await startSpan('photos.create', { userId })
    try {
      const body = await request.json()
      const input = CreatePhotoDto.parse(body)
      const created = await this.repo.createPhoto(userId, input)
      const data = PhotoResponseDto.parse(created)
      return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (error: any) {
      const msg = error?.message || 'Failed to create photo'
      return NextResponse.json({ success: false, error: { message: msg } }, { status: 400 })
    } finally { span.end() }
  }

  async update(request: NextRequest, id: string, userId: string): Promise<NextResponse> {
    const span = await startSpan('photos.update', { userId, id })
    try {
      const body = await request.json().catch(()=>({}))
      const input = UpdatePhotoDto.parse(body)
      const existing = await this.repo.getPhoto(userId, id)
      if (!existing) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
      const updated = await this.repo.updatePhoto(userId, id, input)
      const data = PhotoResponseDto.parse(updated)
      return NextResponse.json({ success: true, data })
    } catch (error) {
      return NextResponse.json({ success: false, error: { message: 'Failed to update photo' } }, { status: 400 })
    } finally { span.end() }
  }

  async remove(id: string, userId: string): Promise<NextResponse> {
    try {
      const ok = await this.repo.deletePhoto(userId, id)
      if (!ok) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
      return NextResponse.json({ success: true, data: { deleted: true } })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to delete photo' } }, { status: 500 })
    }
  }

  async reorder(request: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const body = await request.json()
      const orderedIds = Array.isArray(body?.orderedIds) ? body.orderedIds as string[] : []
      const albumId = typeof body?.albumId === 'string' ? body.albumId : null
      if (!orderedIds.length) return NextResponse.json({ success: false, error: { message: 'orderedIds required' } }, { status: 400 })
      await this.repo.reorder(userId, albumId, orderedIds)
      return NextResponse.json({ success: true, data: { reordered: true } })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to reorder photos' } }, { status: 400 })
    }
  }
}

export class AlbumHandler {
  private repo = new AlbumRepository()

  async list(request: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50
      const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0
      const { albums, total } = await this.repo.listAlbums(userId, limit, offset)
      const data = AlbumListResponseDto.parse({ albums, total, limit, offset })
      return NextResponse.json({ success: true, data })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to list albums' } }, { status: 500 })
    }
  }

  async get(id: string, userId: string): Promise<NextResponse> {
    try {
      const album = await this.repo.getAlbum(userId, id)
      if (!album) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
      const data = AlbumResponseDto.parse(album)
      return NextResponse.json({ success: true, data })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to get album' } }, { status: 500 })
    }
  }

  async create(request: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const body = await request.json()
      const input = CreateAlbumDto.parse(body)
      const album = await this.repo.createAlbum(userId, input)
      const data = AlbumResponseDto.parse(album)
      return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: { message: e?.message || 'Failed to create album' } }, { status: 400 })
    }
  }

  async update(request: NextRequest, id: string, userId: string): Promise<NextResponse> {
    try {
      const body = await request.json().catch(()=>({}))
      const input = UpdateAlbumDto.parse(body)
      const existing = await this.repo.getAlbum(userId, id)
      if (!existing) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
      const updated = await this.repo.updateAlbum(userId, id, input)
      const data = AlbumResponseDto.parse(updated)
      return NextResponse.json({ success: true, data })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: { message: e?.message || 'Failed to update album' } }, { status: 400 })
    }
  }

  async remove(id: string, userId: string): Promise<NextResponse> {
    try {
      const ok = await this.repo.deleteAlbum(userId, id)
      if (!ok) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
      return NextResponse.json({ success: true, data: { deleted: true } })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to delete album' } }, { status: 500 })
    }
  }
}

