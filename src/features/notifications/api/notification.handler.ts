import { NextRequest, NextResponse } from 'next/server'
import { NotificationRepository } from '../repo/notification.repository'
import { NotificationListResponseDto } from '../dto/notification.dto'

export class NotificationHandler {
  private repo = new NotificationRepository()

  async list(request: NextRequest, userId: string) {
    try {
      const url = new URL(request.url)
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20
      const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0
      const unreadOnly = url.searchParams.get('unread') === 'true'
      const res = await this.repo.list(userId, { limit, offset, unreadOnly })
      const data = NotificationListResponseDto.parse(res as any)
      return NextResponse.json({ success: true, data })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to load notifications' } }, { status: 500 })
    }
  }

  async markRead(_request: NextRequest, userId: string, id: string) {
    try {
      const ok = await this.repo.markRead(userId, id)
      if (!ok) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
      return NextResponse.json({ success: true, data: { read: true } })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to mark read' } }, { status: 500 })
    }
  }

  async markAllRead(_request: NextRequest, userId: string) {
    try {
      await this.repo.markAllRead(userId)
      return NextResponse.json({ success: true, data: { read: true } })
    } catch (e) {
      return NextResponse.json({ success: false, error: { message: 'Failed to mark all read' } }, { status: 500 })
    }
  }
}

