import { PhotosHandlerV2 } from '@/lib/api/handlers/photos-handler-v2'
import { NextRequest } from 'next/server'

const handler = new PhotosHandlerV2()

export async function GET(request: Request) {
  return handler.listAlbums(request as NextRequest)
}

export async function POST(request: Request) {
  return handler.createAlbum(request as NextRequest)
}