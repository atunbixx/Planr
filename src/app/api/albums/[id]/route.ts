import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { AlbumHandler } from '@/features/photos/api/photo.handler'

const handler = new AlbumHandler()

async function getHandler(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  const userId = request.user!.id
  return handler.get(params.id, userId)
}

async function putHandler(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  const userId = request.user!.id
  return handler.update(request, params.id, userId)
}

async function deleteHandler(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  const userId = request.user!.id
  return handler.remove(params.id, userId)
}

export const GET = requireOnboarding(getHandler)
export const PUT = requireOnboarding(putHandler)
export const DELETE = requireOnboarding(deleteHandler)
