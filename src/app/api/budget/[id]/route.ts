import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { BudgetHandler } from '@/features/budget/api/budget.handler'

interface RouteParams {
  params: { id: string }
}

// GET /api/budget/[id] - Get a specific budget item
const handler = new BudgetHandler()

async function getHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return handler.get(request as any, request.user!.id, params.id)
}

// PUT /api/budget/[id] - Update a budget item
async function putHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return handler.update(request as any, request.user!.id, params.id)
}

// DELETE /api/budget/[id] - Delete a budget item
async function deleteHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return handler.delete(request as any, request.user!.id, params.id)
}

export const GET = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return getHandler(request, { params })
})

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return putHandler(request, { params })
})

export const DELETE = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return deleteHandler(request, { params })
})
