import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { prisma } from '@/lib/db/prisma'

export const GET = requireAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10))
    const status = url.searchParams.get('status') || undefined
    const channel = url.searchParams.get('channel') || undefined

    const where: any = { userId: req.user!.id }
    if (status) where.status = status
    if (channel) where.channel = channel

    const [total, items] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset })
    ])

    return createSuccessResponse({ items, total, limit, offset })
  } catch (e: any) {
    return createErrorResponse(e?.message || 'Internal error')
  }
})

