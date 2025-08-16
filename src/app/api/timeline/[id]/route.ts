import { TimelineHandlerV2 } from '@/lib/api/handlers/timeline-handler-v2'
import { NextRequest } from 'next/server'

const handler = new TimelineHandlerV2()

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.update(request as NextRequest, id)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.delete(request as NextRequest, id)
}