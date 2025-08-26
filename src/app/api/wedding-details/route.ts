import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { weddingDetailsSchema } from '@/lib/validation/auth'

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  try {
    const details = await prisma.weddingDetails.findUnique({ where: { userId } })
    return NextResponse.json({ success: true, data: details })
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: { message: 'Database unavailable' } }, { status: 503 })
    }
    try {
      const details = await tempStorage.getWeddingDetails(userId)
      return NextResponse.json({ success: true, data: details })
    } catch (err) {
      return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
    }
  }
}

export const GET = requireOnboarding(handler)

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const userId = request.user!.id
  const body = await request.json().catch(() => ({}))
  const parsed = weddingDetailsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid payload' } }, { status: 400 })
  }
  try {
    const data = parsed.data
    const updated = await prisma.weddingDetails.upsert({
      where: { userId },
      update: {
        venue: data.venue,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
        budget: data.budget as any,
        guestCount: data.guestCount as any,
      },
      create: {
        userId,
        venue: data.venue,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
        budget: data.budget as any,
        guestCount: data.guestCount as any,
      }
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: { message: 'Database unavailable' } }, { status: 503 })
    }
    const data = parsed.data
    const updated = await tempStorage.createOrUpdateWeddingDetails(userId, {
      venue: data.venue,
      weddingDate: data.weddingDate,
      budget: data.budget as any,
      guestCount: data.guestCount as any,
    })
    return NextResponse.json({ success: true, data: updated })
  }
})
