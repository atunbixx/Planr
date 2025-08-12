import { PhotosHandlerV2 } from '@/lib/api/handlers/photos-handler-v2'

const handler = new PhotosHandlerV2()

export async function POST(request: Request) {
  return handler.bulkToggleFavorite(request)
}