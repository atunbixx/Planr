import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { VendorsHandler } from '@/features/vendors/api/vendors.handler'

// GET /api/vendors - List vendors with optional search/filter/sort/pagination
const handler = new VendorsHandler()

async function getHandler(request: AuthenticatedRequest) {
  return handler.list(request as any, request.user!.id)
}

async function postHandler(request: AuthenticatedRequest) {
  return handler.create(request as any, request.user!.id)
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)
