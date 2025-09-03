import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { PhotoHandler } from '@/features/photos/api/photo.handler'

const handler = new PhotoHandler()

async function postHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return handler.reorder(request, userId)
}

export const POST = requireOnboarding(postHandler)
