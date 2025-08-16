import { NextRequest } from 'next/server'
import { SettingsHandlerV2 } from '@/lib/api/handlers/settings-handler-v2'

const handler = new SettingsHandlerV2()

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.updateCollaborator(request, id)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.removeCollaborator(request, id)
}