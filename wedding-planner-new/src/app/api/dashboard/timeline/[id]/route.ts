import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { tempStorage } from '@/lib/db/temp-storage'

async function putHandler(request: AuthenticatedRequest, id: string) {
  const userId = request.user!.id
  const body = await request.json().catch(() => ({}))
  const data: any = {}
  if (typeof body?.time === 'string') data.time = body.time
  if (typeof body?.title === 'string') data.title = body.title
  if (typeof body?.description === 'string') data.description = body.description
  if (typeof body?.category === 'string') data.category = body.category
  if (typeof body?.duration !== 'undefined') data.duration = Number(body.duration)
  if (typeof body?.location === 'string') data.location = body.location
  const updated = await tempStorage.updateTimelineEvent(userId, id, data)
  if (!updated) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
  return NextResponse.json({ success: true, data: updated })
}

async function deleteHandler(request: AuthenticatedRequest, id: string) {
  const userId = request.user!.id
  const ok = await tempStorage.deleteTimelineEvent(userId, id)
  if (!ok) return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
  return NextResponse.json({ success: true })
}

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const id = request.url.split('/').pop()!
  return putHandler(request, id)
})

export const DELETE = requireOnboarding(async (request: AuthenticatedRequest) => {
  const id = request.url.split('/').pop()!
  return deleteHandler(request, id)
})

