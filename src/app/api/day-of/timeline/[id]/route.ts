import { NextRequest } from 'next/server'
import { DayOfTimelineHandler } from '@/lib/api/handlers/day-of-handler'

const handler = new DayOfTimelineHandler()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handler.handle(request, { params: resolvedParams })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handler.handle(request, { params: resolvedParams })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handler.handle(request, { params: resolvedParams })
}