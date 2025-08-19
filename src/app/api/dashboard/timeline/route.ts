import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { tempStorage } from '@/lib/db/temp-storage'

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  try {
    const events = await tempStorage.listTimeline(userId)
    return NextResponse.json({ success: true, data: { events } })
  } catch (err) {
    return NextResponse.json({ success: true, data: { events: [] } })
  }
}
async function postHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  const body = await request.json().catch(() => ({}))
  const time = String(body?.time || '').trim()
  const title = String(body?.title || '').trim()
  if (!time || !title) return NextResponse.json({ success: false, error: { message: 'time and title required' } }, { status: 400 })
  const event = await tempStorage.addTimelineEvent(userId, {
    time,
    title,
    description: body?.description ? String(body.description) : undefined,
    category: body?.category ? String(body.category) : undefined,
    duration: body?.duration !== undefined ? Number(body.duration) : undefined,
    location: body?.location ? String(body.location) : undefined,
  })
  return NextResponse.json({ success: true, data: event }, { status: 201 })
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)
