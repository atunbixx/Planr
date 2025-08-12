import { NextRequest } from 'next/server'
import { SeatingTablesHandler } from '@/lib/api/handlers/seating-handler'

const handler = new SeatingTablesHandler()

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