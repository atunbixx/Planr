import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { tempStorage } from '@/lib/db/temp-storage'
import { z } from 'zod'
import { startSpan } from '@/lib/observability/otel'

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
  const span = await startSpan('settings.getPreferences', { userId })
  try {
    const prefs = await tempStorage.getPreferences(userId)
    return NextResponse.json({ success: true, data: prefs })
  } finally { span.end() }
})

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const userId = request.user!.id
  const body = await request.json().catch(() => ({}))
  const parsed = PreferencesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid preferences', details: parsed.error.issues } }, { status: 400 })
  }
  const data = parsed.data
  const span = await startSpan('settings.updatePreferences', { userId })
  try {
    const updated = await tempStorage.upsertPreferences(userId, data)
    return NextResponse.json({ success: true, data: updated })
  } finally { span.end() }
})
