import { NextRequest } from 'next/server'
import { GuestsHandler } from '@/lib/api/handlers/guests-handler'

const handler = new GuestsHandler()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handler.update(request, resolvedParams.id)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handler.delete(request, resolvedParams.id)
}