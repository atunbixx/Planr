import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { tempStorage } from '@/lib/db/temp-storage'
import { prisma } from '@/lib/db/prisma'
import { SeatingService } from '@/features/seating/service/seating.service'

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  const body = await request.json().catch(() => ({}))
  const groupByRelationship = Boolean(body?.groupByRelationship)
  const service = new SeatingService()
  try {
    const guests = await prisma.guest.findMany({ where: { userId }, select: { id: true } })
    const allIds = guests.map(g => g.id)
    const result = await service.autoAssign(userId, allIds, groupByRelationship)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    return NextResponse.json({ success: true, data: { tables: result.data } })
  } catch (_) {
    const guests = await tempStorage.findGuestsByUserId(userId)
    const allIds = guests.map(g => g.id)
    const result = await service.autoAssign(userId, allIds, groupByRelationship)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    return NextResponse.json({ success: true, data: { tables: result.data } })
  }
}

export const POST = requireOnboarding(handler)
