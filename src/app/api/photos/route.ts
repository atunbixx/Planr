import { NextRequest } from 'next/server'
import { PhotosHandlerV2 } from '@/lib/api/handlers/photos-handler-v2'

const handler = new PhotosHandlerV2()

export async function GET(request: NextRequest) {
  return handler.listPhotos(request)
}

export async function POST(request: NextRequest) {
  return handler.createPhoto(request)
}