import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { tempStorage } from '@/lib/db/temp-storage'
import { z } from 'zod'

const PreferencesSchema = z.object({
  currency: z.string().max(8).optional(),
  language: z.string().max(8).optional(),
  region: z.string().max(16).optional(),
  timeZone: z.string().max(64).optional(),
  dateFormat: z.string().max(32).optional(),
  timeFormat: z.string().max(32).optional(),
})

export const GET = requireOnboarding(async (request: AuthenticatedRequest) => {
  const userId = request.user!.id
  const prefs = await tempStorage.getPreferences(userId)
  return NextResponse.json({ success: true, data: prefs })
})

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const userId = request.user!.id
  const body = await request.json().catch(() => ({}))
  const parsed = PreferencesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid preferences', details: parsed.error.issues } }, { status: 400 })
  }
  const data = parsed.data
  const updated = await tempStorage.upsertPreferences(userId, data)
  return NextResponse.json({ success: true, data: updated })
})
