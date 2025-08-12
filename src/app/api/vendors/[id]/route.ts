import { NextRequest } from 'next/server'
import { VendorsHandler } from '@/lib/api/handlers/vendors-handler'

const handler = new VendorsHandler()

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