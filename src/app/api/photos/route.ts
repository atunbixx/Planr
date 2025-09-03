import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { PhotoHandler } from '@/features/photos/api/photo.handler'

const handler = new PhotoHandler()

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return handler.list(request, userId)
}

async function postHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return handler.create(request, userId)
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)
