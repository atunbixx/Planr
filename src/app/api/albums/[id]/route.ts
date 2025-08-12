import { PhotosHandlerV2 } from '@/lib/api/handlers/photos-handler-v2'

const handler = new PhotosHandlerV2()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handler.getAlbum(request, params.id)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handler.updateAlbum(request, params.id)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handler.deleteAlbum(request, params.id)
}