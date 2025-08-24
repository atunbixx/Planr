import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { tempStorage } from '@/lib/db/temp-storage'

export const GET = requireOnboarding(async (request: AuthenticatedRequest) => {
  const userId = request.user!.id
  const prefs = await tempStorage.getPreferences(userId)
  return NextResponse.json({ success: true, data: prefs })
})

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const userId = request.user!.id
  const body = await request.json().catch(() => ({}))
  const allowed = ['currency','language','region','timeZone','dateFormat','timeFormat'] as const
  const data: any = {}
  for (const k of allowed) {
    if (typeof body?.[k] !== 'undefined') data[k] = String(body[k])
  }
  const updated = await tempStorage.upsertPreferences(userId, data)
  return NextResponse.json({ success: true, data: updated })
})

