import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { VendorsHandler } from '@/features/vendors/api/vendors.handler'

interface RouteParams {
  params: { id: string }
}

// GET /api/vendors/[id] - Get a specific vendor
const handler = new VendorsHandler()

async function getHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return handler.get(request as any, request.user!.id, params.id)
}

// PUT /api/vendors/[id] - Update a vendor
async function putHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return handler.update(request as any, request.user!.id, params.id)
}

// DELETE /api/vendors/[id] - Delete a vendor
async function deleteHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return handler.delete(request as any, request.user!.id, params.id)
}

export const GET = requireOnboarding(async (request: AuthenticatedRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()!
  const params = { id }
  return getHandler(request, { params })
})

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()!
  const params = { id }
  return putHandler(request, { params })
})

export const DELETE = requireOnboarding(async (request: AuthenticatedRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()!
  const params = { id }
  return deleteHandler(request, { params })
})
