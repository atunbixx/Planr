import { PhotosHandlerV2 } from '@/lib/api/handlers/photos-handler-v2'
import { NextRequest } from 'next/server'

const handler = new PhotosHandlerV2()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handler.getAlbum(request as NextRequest, id)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handler.updateAlbum(request as NextRequest, id)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handler.deleteAlbum(request as NextRequest, id)
}