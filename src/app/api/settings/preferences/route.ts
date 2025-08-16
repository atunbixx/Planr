import { SettingsHandlerV2 } from '@/lib/api/handlers/settings-handler-v2'
import { NextRequest } from 'next/server'

const handler = new SettingsHandlerV2()

export async function GET(request: Request) {
  return handler.getPreferences(request as NextRequest)
}

export async function PUT(request: Request) {
  return handler.updatePreferences(request as NextRequest)
}